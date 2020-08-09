#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { ZettelkastenDistributionStack } from '../lib/zettelkasten-distribution';
import { ZettelkastenContinuousDeploymentStack } from '../lib/zettelkasten-continuous-deployment';

const app = new cdk.App();

new ZettelkastenContinuousDeploymentStack(app, 'ZettelkastenContinuousDeployment');

new ZettelkastenDistributionStack(app, 'ZettelkastenDistribution', { 
    env: { region: 'us-east-1' },
    bucketName: 'bucketName from ZettelkastenContinuousDeployment deployment'
});
