import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { CicdStack } from '../lib/ci-cd-stack';
import { IdeStack } from '../lib/ide-stack';

test('All Stacks', () => {
    const app = new cdk.App();
    const cicd = new CicdStack(app, 'cicd');
    expectCDK(cicd).to(haveResource('AWS::CodePipeline::Pipeline'));
    const ide = new IdeStack(app, 'ide', {
      repoName: cicd.repoName
    });
    expectCDK(ide).to(haveResource('AWS::Cloud9::EnvironmentEC2'));
});
