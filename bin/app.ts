#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CicdStack } from '../lib/ci-cd-stack';
import { IdeStack } from '../lib/ide-stack';

const app = new cdk.App();
const cicd = new CicdStack(app, 'quickstart', {
  stackName: 'quickstart-shi-crpm-ci-cd',
  description: 'Infrastructure CI-CD quick start'
});
new IdeStack(cicd, 'ide', {
  repoName: cicd.repoName
});
