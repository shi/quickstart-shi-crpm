import cloud9 = require('@aws-cdk/aws-cloud9');
import cfn = require('@aws-cdk/aws-cloudformation');
import iam = require("@aws-cdk/aws-iam");
import lambda = require('@aws-cdk/aws-lambda');
import ssm = require("@aws-cdk/aws-ssm");
import cdk = require('@aws-cdk/core');
import crpm = require('crpm');
import fs = require('fs');
import yaml = require('js-yaml');

const BASE_DIR = `${__dirname}/../../..`;

export class EnvironmentEC2 extends cdk.Stack {
  constructor(scope: cdk.App, id: string, stackProps?: cdk.StackProps) {
    super(scope, id, stackProps);
    
    // Cloud9 environment
    const props: crpm.Writeable<cloud9.CfnEnvironmentEC2Props> = crpm.loadProps(`${__dirname}/props.yaml`);
    props.name = cdk.Aws.STACK_NAME;
    const subnetId = this.node.tryGetContext('subnet_id');
    if (subnetId) {
      props.subnetId = subnetId;
    }
    const c9 = new cloud9.CfnEnvironmentEC2(this, 'EnvironmentEC2', props);
    
    // Lambda role
    const roleProps: crpm.Writeable<iam.CfnRoleProps> = crpm.loadProps(
      `${BASE_DIR}/security-identity-compliance/iam/role-lambda/props.yaml`
    );
    roleProps.roleName = `lambda-${cdk.Aws.STACK_NAME}`;
    const role = new iam.CfnRole(this, 'Role', roleProps);
    
    // Systems Manager document
    const ssmDocDir = `${BASE_DIR}/management-governance/ssm/document-configure-cloud9`;
    const ssmDocProps: crpm.Writeable<ssm.CfnDocumentProps> = crpm.loadProps(`${ssmDocDir}/props.yaml`);
    ssmDocProps.content = yaml.safeLoad(fs.readFileSync(`${ssmDocDir}/content.yaml`, 'utf8'));
    ssmDocProps.name = `${cdk.Aws.STACK_NAME}-configure-cloud9`;
    const ssmDoc = new ssm.CfnDocument(this, "Document", ssmDocProps);
    
    // Lambda function
    const fnDir = `${BASE_DIR}/compute/lambda/function-custom-resource-ide`;
    const fnProps: crpm.Writeable<lambda.CfnFunctionProps> = crpm.loadProps(`${fnDir}/props.yaml`);
    fnProps.code = {
      zipFile: fs.readFileSync(`${fnDir}/index.js`, 'utf8')
    }
    fnProps.role = role.getAtt('Arn').toString();
    fnProps.functionName = `${cdk.Aws.STACK_NAME}-custom-resource`;
    const fn = new lambda.CfnFunction(this, 'Function', fnProps);
    
    // Custom resource
    const crProps: crpm.Writeable<cfn.CfnCustomResourceProps> = crpm.loadProps(
      `${BASE_DIR}/management-governance/cloudformation/custom-resource-ide/props.yaml`
    );
    crProps.serviceToken = fn.getAtt('Arn').toString();
    const cr = new cfn.CfnCustomResource(this, 'CustomResource', crProps);
    cr.addPropertyOverride('cloud9EnvironmentId', c9.ref);
    cr.addPropertyOverride('ssmDocumentName', ssmDoc.ref);
  }
}
