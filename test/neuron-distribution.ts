import { expect, haveResource, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { NeuronDistributionStack } from '../lib/neuron-distribution';
import test from 'ava';

test('originAccessIdentity', (t) => {
  const app = new cdk.App();
  const stack = new NeuronDistributionStack(app, 'MyTestStack');
  expect(stack).to(haveResourceLike("AWS::CloudFront::CloudFrontOriginAccessIdentity"));
  t.pass();
});

test('distribution', (t) => {
  const app = new cdk.App();
  const stack = new NeuronDistributionStack(app, 'MyTestStack');
  expect(stack).to(haveResourceLike("AWS::CloudFront::Distribution", {
    "DistributionConfig": {
      "DefaultCacheBehavior": {
        "TargetOriginId": "origin1",
        "ViewerProtocolPolicy": "redirect-to-https"
      },
      "DefaultRootObject": "index.html",
      "HttpVersion": "http2",
      "Origins": [
        {
          "DomainName": {
            "Fn::Join": [
              "",
              [
                "zettelkasten-godu.s3.eu-west-1.",
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
  const stack = new NeuronDistributionStack(app, 'MyTestStack');

  expect(stack).to(haveResourceLike("AWS::S3::BucketPolicy", {
    "Bucket": "zettelkasten-godu", "PolicyDocument": {
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
                ":s3:::zettelkasten-godu/*"
              ]
            ]
          }
        }
      ]
    }
  }));
  t.pass();
});

