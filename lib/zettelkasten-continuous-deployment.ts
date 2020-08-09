import * as s3 from '@aws-cdk/aws-s3';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipelineActions from '@aws-cdk/aws-codepipeline-actions';
import * as cdk from '@aws-cdk/core';

export class ZettelkastenContinuousDeploymentStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const repository = new codecommit.Repository(this, 'repository', {
      repositoryName: 'zettelkasten'
    });


    const artifactBucket = new s3.Bucket(this, "Artifact", {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const cacheBucket = new s3.Bucket(this, "Cache", {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const pipelineProject = new codebuild.PipelineProject(this, 'pipelineProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
        privileged: true
      },
      cache: codebuild.Cache.bucket(cacheBucket)
    });

    const buildBucket = new s3.Bucket(this, "buildBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    new codepipeline.Pipeline(this, "pipeline", {
      artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipelineActions.CodeCommitSourceAction({
              actionName: 'CodeCommit',
              repository,
              output: sourceOutput
            })
          ]
        },
        {
          stageName: 'Build',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'CodeBuild',
              project: pipelineProject,
              input: sourceOutput,
              outputs: [buildOutput]
            })
          ]
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.S3DeployAction({
              actionName: 'S3Deploy',
              bucket: buildBucket,
              input: buildOutput
            })
          ]
        }
      ]
    });

    new cdk.CfnOutput(this, 'buildBucketOutput', {
      value: buildBucket.bucketName,
      exportName: 'BuildBucket', 
    });
  }
}
