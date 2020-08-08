#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { NeuronDistributionStack } from '../lib/neuron-distribution';

const app = new cdk.App();
new NeuronDistributionStack(app, 'NeuronDistribution', { env: { region: 'us-east-1' } });
