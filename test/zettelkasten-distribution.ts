import { expect, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { ZettelkastenDistributionStack } from '../lib/zettelkasten-distribution';
import test from 'ava';

test('originAccessIdentity', (t) => {
  const app = new cdk.App();
  const stack = new ZettelkastenDistributionStack(app, 'MyTestStack', {bucketName: 'MyBucket'});
  expect(stack).to(haveResourceLike("AWS::CloudFront::CloudFrontOriginAccessIdentity"));
  t.pass();
});

test('distribution', (t) => {
  const app = new cdk.App();
  const stack = new ZettelkastenDistributionStack(app, 'MyTestStack', {bucketName: 'MyBucket'});
  
  expect(stack).to(haveResourceLike("AWS::CloudFront::Distribution", {
    "DistributionConfig": {
      "DefaultCacheBehavior": {
        "TargetOriginId": "origin1",
        "ViewerProtocolPolicy": "redirect-to-https",
        "LambdaFunctionAssociations": [
          {
            "EventType": "viewer-request"
          }
        ]
      },
      "DefaultRootObject": "index.html",
      "HttpVersion": "http2",
      "Origins": [
        {
          "DomainName": {
            "Fn::Join": [
              "",
              [
                "MyBucket.s3.eu-west-1.",
                {
                  "Ref": "AWS::URLSuffix"
                }
              ]
            ]
          },
          "Id": "origin1",
          "S3OriginConfig": {
            "OriginAccessIdentity": {
              "Fn::Join": [
                "",
                [
                  "origin-access-identity/cloudfront/",
                  {
                    "Ref": "originAccessIdentity402DAA30"
                  }
                ]
              ]
            }
          }
        }
      ],
      "PriceClass": "PriceClass_100",
      "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true
      }
    }
  }));
  t.pass();
});

test('bucketPolicy', (t) => {
  const app = new cdk.App();
  const stack = new ZettelkastenDistributionStack(app, 'MyTestStack', {bucketName: 'MyBucket'});

  expect(stack).to(haveResourceLike("AWS::S3::BucketPolicy", {
    "Bucket": "MyBucket", "PolicyDocument": {
      "Statement": [
        {
          "Action": "s3:GetObject",
          "Effect": "Allow",
          "Principal": {
            "CanonicalUser": {
              "Fn::GetAtt": [
                "originAccessIdentity402DAA30",
                "S3CanonicalUserId"
              ]
            }
          },
          "Resource": {
            "Fn::Join": [
              "",
              [
                "arn:",
                {
                  "Ref": "AWS::Partition"
                },
                ":s3:::MyBucket/*"
              ]
            ]
          }
        }
      ]
    }
  }));
  t.pass();
});

test('authenticationFunction', (t) => {
  const app = new cdk.App();
  const stack = new ZettelkastenDistributionStack(app, 'MyTestStack', {bucketName: 'MyBucket'});

  expect(stack).to(haveResourceLike("AWS::Lambda::Function", {
    "Runtime": "nodejs12.x"
  }));
  expect(stack).to(haveResourceLike("AWS::Lambda::Version", {
    "FunctionName": {
      "Ref": "authenticationFunction07DF20D0"
    }
  }));
  t.pass();
});
