import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

import { BASE_STACK_NAME } from '../const';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export default class ComputeStack extends cdk.Stack {
  public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, {
      ...props,
      stackName: `${BASE_STACK_NAME}-ComputeStack`,
    });

    const { vpc } = props;

    // ECSクラスターの作成
    const cluster = new ecs.Cluster(this, 'FargateCluster', {
      vpc,
      clusterName: 'FastapiEcsCluster',
    });

    // Fargateタスク定義の作成
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'FargateTaskDef', {
      cpu: 512,
      memoryLimitMiB: 1024,
    });

    // ECRプル権限の追加
    taskDefinition.addToExecutionRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ],
        resources: ["*"]
      })
    );

    const container = taskDefinition.addContainer('WebContainer', {
      image: ecs.ContainerImage.fromRegistry(process.env.ECR_REPOSITORY_URI!),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'FargateWebApp' }),
      containerName: 'FastapiEcsContainer',
    });

    container.addPortMappings({
      containerPort: 80,
      hostPort: 80,
    });

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'FargateService', {
      cluster,
      taskDefinition,
      publicLoadBalancer: true,
      desiredCount: 1,
      assignPublicIp: false,
      listenerPort: 80,
    });

    fargateService.service.connections.allowFromAnyIpv4(ec2.Port.tcp(80), 'Allow HTTP access from the internet');

    fargateService.taskDefinition.addToExecutionRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents'
        ],
        resources: ["*"]
      })
    );

    this.fargateService = fargateService;
  }
}
