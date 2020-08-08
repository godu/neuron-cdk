import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import { BucketPolicy } from '@aws-cdk/aws-s3';

export class NeuronDistributionStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(this, 'bucket', 'zettelkasten-godu');

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'originAccessIdentity', {
      comment: 'neuron-distribution'
    })

    new cloudfront.CloudFrontWebDistribution(this, 'distribution', {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      originConfigs: [{
        behaviors: [{ 
          isDefaultBehavior: true
        }],
        s3OriginSource: {
          s3BucketSource: s3.Bucket.fromBucketAttributes(this, 'bucketSource', {
            bucketArn: "arn:aws:s3:::zettelkasten-godu",
            bucketRegionalDomainName: `zettelkasten-godu.s3.eu-west-1.${cdk.Stack.of(this).urlSuffix}`
          }),
          originAccessIdentity
        },
      }]
    })

    const bucketPolicy = new BucketPolicy(this, 'bucketPolicy', {
      bucket
    });
    bucketPolicy.document.addStatements(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject'],
      resources: [`${bucket.bucketArn}/*`],
      principals: [originAccessIdentity.grantPrincipal]
    }))
  }
}
