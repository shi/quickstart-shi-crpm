import cfn = require('@aws-cdk/aws-cloudformation');
import codebuild = require("@aws-cdk/aws-codebuild");
import codecommit = require("@aws-cdk/aws-codecommit");
import codepipeline = require("@aws-cdk/aws-codepipeline");
import events = require("@aws-cdk/aws-events");
import iam = require("@aws-cdk/aws-iam");
import lambda = require('@aws-cdk/aws-lambda');
import s3 = require("@aws-cdk/aws-s3");
import cdk = require("@aws-cdk/core");
import crpm = require("crpm");
import fs = require('fs');

const BASE_DIR = `${__dirname}/../../..`;

export class Pipeline extends cdk.Stack {
  constructor(scope: cdk.App, id: string, stackProps?: cdk.StackProps) {
    super(scope, id, stackProps);
    
    // CloudFormation role
    // After this role has been used by the pipeline, it needs to stick around
    // until the very end when deleting the stack, because it will need to be
    // assumed to delete resources that were modified by the pipeline
    const cfnRoleProps: crpm.Writeable<iam.CfnRoleProps> = crpm.loadProps(
      `${BASE_DIR}/security-identity-compliance/iam/role-cloudformation/props.yaml`
    );
    cfnRoleProps.roleName = `cloudformation-${cdk.Aws.STACK_NAME}`;
    const cfnRole = new iam.CfnRole(this, "CloudFormationRole", cfnRoleProps);
    
    // S3 bucket
    let artifactBucket;
    let artifactBucketName = this.node.tryGetContext("artifact_bucket_name");
    if (!artifactBucketName) {
      artifactBucket = new s3.CfnBucket(
        this,
        "Bucket",
        crpm.loadProps(`${BASE_DIR}/storage/s3/bucket-artifacts/props.yaml`)
      );
      artifactBucketName = artifactBucket.ref;
    }
    
    // Lambda role
    const fnRoleProps: crpm.Writeable<iam.CfnRoleProps> = crpm.loadProps(
      `${BASE_DIR}/security-identity-compliance/iam/role-lambda/props.yaml`
    );
    fnRoleProps.roleName = `lambda-${cdk.Aws.STACK_NAME}`;
    const fnRole = new iam.CfnRole(this, 'LambdaRole', fnRoleProps);
    // Make sure the CloudFormation role sticks around until the end
    fnRole.addDependsOn(cfnRole);
    
    // Lambda function
    const fnDir = `${BASE_DIR}/compute/lambda/function-custom-resource`;
    const fnProps: crpm.Writeable<lambda.CfnFunctionProps> = crpm.loadProps(`${fnDir}/props.yaml`);
    fnProps.code = {
      zipFile: fs.readFileSync(`${fnDir}/index.py`, 'utf8')
    }
    fnProps.role = fnRole.getAtt('Arn').toString();
    fnProps.functionName = `${cdk.Aws.STACK_NAME}-custom-resource`;
    const fn = new lambda.CfnFunction(this, 'Function', fnProps);
    
    // Custom resource
    const crProps: crpm.Writeable<cfn.CfnCustomResourceProps> = crpm.loadProps(
      `${BASE_DIR}/management-governance/cloudformation/custom-resource/props.yaml`
    );
    crProps.serviceToken = fn.getAtt('Arn').toString();
    const cr = new cfn.CfnCustomResource(this, 'CustomResource', crProps);
    cr.addPropertyOverride('ArtifactBucketName', artifactBucketName);
    if (artifactBucket != undefined) {
      cr.addPropertyOverride('EmptyBucketOnDelete', true);
    } else {
      cr.addPropertyOverride('EmptyBucketOnDelete', false);
    }
    
    // CodeCommit repository
    const repoProps: crpm.Writeable<codecommit.CfnRepositoryProps> = crpm.loadProps(
      `${BASE_DIR}/developer-tools/codecommit/repository/props.yaml`
    );
    repoProps.repositoryName = cdk.Aws.STACK_NAME;
    (repoProps.code as any).s3.bucket = artifactBucketName;
    const repo = new codecommit.CfnRepository(this, "Repository", repoProps);
    repo.addDependsOn(cr);
    
    // CodeBuild role
    const projectRoleProps: crpm.Writeable<iam.CfnRoleProps> = crpm.loadProps(
      `${BASE_DIR}/security-identity-compliance/iam/role-codebuild/props.yaml`
    );
    projectRoleProps.roleName = `codebuild-${cdk.Aws.STACK_NAME}`;
    const projectRole = new iam.CfnRole(this, "CodeBuildRole", projectRoleProps);
    
    // CodeBuild project
    const projectProps: crpm.Writeable<codebuild.CfnProjectProps> = crpm.loadProps(
      `${BASE_DIR}/developer-tools/codebuild/project/props.yaml`
    );
    projectProps.serviceRole = `${projectRole.getAtt("Arn")}`;
    projectProps.name = cdk.Aws.STACK_NAME;
    const project = new codebuild.CfnProject(this, "Project", projectProps);
    
    // CodePipeline role
    const pipelineRoleProps: crpm.Writeable<iam.CfnRoleProps> = crpm.loadProps(
      `${BASE_DIR}/security-identity-compliance/iam/role-codepipeline/props.yaml`
    );
    pipelineRoleProps.roleName = `codepipeline-${cdk.Aws.STACK_NAME}`;
    const pipelineRole = new iam.CfnRole(this, "CodePipelineRole", pipelineRoleProps);
    
    // CodePipeline pipeline
    const pipelineProps: crpm.Writeable<codepipeline.CfnPipelineProps> = crpm.loadProps(
      `${BASE_DIR}/developer-tools/codepipeline/pipeline/props.yaml`
    );
    pipelineProps.roleArn = `${pipelineRole.getAtt("Arn")}`;
    const stages = (pipelineProps.stages as any);
    stages[0].actions[0].configuration.RepositoryName = `${repo.getAtt("Name")}`;
    stages[1].actions[0].configuration.ProjectName = project.ref;
    stages[2].actions[0].configuration.RoleArn = cfnRole.getAtt("Arn").toString();
    stages[2].actions[0].configuration.StackName = cdk.Aws.STACK_NAME;
    stages[3].actions[0].configuration.RoleArn = cfnRole.getAtt("Arn").toString();
    stages[3].actions[0].configuration.StackName = cdk.Aws.STACK_NAME;
    pipelineProps.artifactStore = {
      location: artifactBucketName,
      type: "S3"
    };
    pipelineProps.name = cdk.Aws.STACK_NAME;
    const pipeline = new codepipeline.CfnPipeline(this, "Pipeline", pipelineProps);
    
    // CloudWatch Events role
    const eventsRoleProps: crpm.Writeable<iam.CfnRoleProps> = crpm.loadProps(
      `${BASE_DIR}/security-identity-compliance/iam/role-events/props.yaml`
    );
    eventsRoleProps.roleName = `cloudwatch-events-${cdk.Aws.STACK_NAME}`;
    const eventsRole = new iam.CfnRole(this, "EventsRole", eventsRoleProps);
    
    // CloudWatch Events rule
    const ruleProps: crpm.Writeable<events.CfnRuleProps> = crpm.loadProps(
      `${BASE_DIR}/management-governance/events/rule/props.yaml`
    );
    ruleProps.eventPattern.resources = [
      `${repo.getAtt("Arn")}`
    ]
    ruleProps.name = `codepipeline-${cdk.Aws.STACK_NAME}`;
    const target = (ruleProps.targets as any)[0];
    target.arn = `arn:aws:codepipeline:${this.region}:${this.account}:${pipeline.ref}`;
    target.roleArn = `${eventsRole.getAtt("Arn")}`;
    new events.CfnRule(this, "Rule", ruleProps);
  }
}