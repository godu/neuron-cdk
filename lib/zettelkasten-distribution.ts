import * as s3 from '@aws-cdk/aws-s3';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as fs from 'fs';
import * as path from 'path';

export class ZettelkastenDistributionStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: {bucketName: string} & cdk.StackProps) {
    super(scope, id, props);

    const bucket = s3.Bucket.fromBucketName(this, 'bucket', props.bucketName);

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'originAccessIdentity', {
      comment: 'zettelkasten-distribution'
    })

    const authenticationFunction = new lambda.Function(this, 'authenticationFunction', {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(fs.readFileSync(path.join(__dirname, 'function/index.js'), 'utf-8')),
    })

    new cloudfront.CloudFrontWebDistribution(this, 'distribution', {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      originConfigs: [{
        behaviors: [{
          isDefaultBehavior: true,
          lambdaFunctionAssociations: [{
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
            lambdaFunction: authenticationFunction.currentVersion
          }]
        }],
        s3OriginSource: {
          s3BucketSource: s3.Bucket.fromBucketAttributes(this, 'bucketSource', {
            bucketArn: `arn:aws:s3:::${props.bucketName}`,
            bucketRegionalDomainName: `${props.bucketName}.s3.eu-west-1.${cdk.Stack.of(this).urlSuffix}`
          }),
          originAccessIdentity
        },
      }]
    })

    const bucketPolicy = new s3.BucketPolicy(this, 'bucketPolicy', {
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
