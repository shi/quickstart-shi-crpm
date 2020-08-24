import * as cdk from '@aws-cdk/core';
import * as cfn from '@aws-cdk/aws-cloudformation';
import * as cloud9 from '@aws-cdk/aws-cloud9';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as ssm from '@aws-cdk/aws-ssm';
import * as crpm from 'crpm';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

interface IdeStackProps extends cdk.StackProps {
  repoName: string;
}

export class IdeStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: IdeStackProps) {
    super(scope, id, props);
    
    // Cloud9 environment
    const cloud9Props = crpm.load<cloud9.CfnEnvironmentEC2Props>(
      `${__dirname}/../res/developer-tools/cloud9/environment-ec2/props.yaml`
    );
    cloud9Props.name = cdk.Aws.STACK_NAME;
    cloud9Props.repositories[0].repositoryUrl = cdk.Fn.join('',
      [
        'https://git-codecommit.',
        this.region,
        '.amazonaws.com/v1/repos/',
        props.repoName
      ]
    );
    const c9 = new cloud9.CfnEnvironmentEC2(this, 'EnvironmentEC2', cloud9Props);
    
    // Cloud9 EC2 instance role
    const ec2RoleProps = crpm.load<iam.CfnRoleProps>(
      `${__dirname}/../res/security-identity-compliance/iam/role-ec2/props.yaml`
    );
    ec2RoleProps.roleName = `ec2-${cdk.Aws.STACK_NAME}`;
    const ec2Role = new iam.CfnRole(this, 'EC2Role', ec2RoleProps);
    
    // Instance profile
    const instanceProfileProps = crpm.load<iam.CfnInstanceProfileProps>(
      `${__dirname}/../res/security-identity-compliance/iam/instance-profile-ide/props.yaml`
    );
    instanceProfileProps.roles = [ec2Role.ref];
    instanceProfileProps.instanceProfileName = cloud9Props.name;
    const instanceProfile = new iam.CfnInstanceProfile(this, 'InstanceProfile', instanceProfileProps);
    
    // Systems Manager document
    const ssmDocDir = `${__dirname}/../res/management-governance/ssm/document-configure-cloud9`;
    const ssmDocProps = crpm.load<ssm.CfnDocumentProps>(`${ssmDocDir}/props.yaml`);
    ssmDocProps.content = yaml.safeLoad(fs.readFileSync(`${ssmDocDir}/content.yaml`, 'utf8'));
    ssmDocProps.name = `${cdk.Aws.STACK_NAME}-configure-cloud9`;
    const ssmDoc = new ssm.CfnDocument(this, 'Document', ssmDocProps);
    
    // Lambda role
    const lambdaRoleProps = crpm.load<iam.CfnRoleProps>(
      `${__dirname}/../res/security-identity-compliance/iam/role-lambda/props.yaml`
    );
    lambdaRoleProps.roleName = `lambda-${cdk.Aws.STACK_NAME}`;
    const lambdaRole = new iam.CfnRole(this, 'LambdaRole', lambdaRoleProps);
    
    // Lambda function
    const fnDir = `${__dirname}/../res/compute/lambda/function-custom-resource-ide`;
    const fnProps = crpm.load<lambda.CfnFunctionProps>(`${fnDir}/props.yaml`);
    fnProps.code = {
      zipFile: fs.readFileSync(`${fnDir}/index.js`, 'utf8')
    }
    fnProps.role = lambdaRole.attrArn;
    fnProps.functionName = `${cdk.Aws.STACK_NAME}-custom-resource`;
    const fn = new lambda.CfnFunction(this, 'Function', fnProps);
    
    // Custom resource
    const crProps = crpm.load<cfn.CfnCustomResourceProps>(
      `${__dirname}/../res/management-governance/cloudformation/custom-resource-ide/props.yaml`
    );
    crProps.serviceToken = fn.attrArn;
    const cr = new cfn.CfnCustomResource(this, 'CustomResource', crProps);
    cr.addPropertyOverride('cloud9EnvironmentId', c9.ref);
    cr.addPropertyOverride('instanceProfileName', instanceProfile.ref);
    cr.addPropertyOverride('ssmDocumentName', ssmDoc.ref);
  }
}
