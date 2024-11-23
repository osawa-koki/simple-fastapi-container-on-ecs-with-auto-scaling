import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

import { BASE_STACK_NAME } from '../const';

interface OutputStackProps extends cdk.StackProps {
  fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;
}

export default class OutputStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: OutputStackProps) {
    super(scope, id, {
      ...props,
      stackName: `${BASE_STACK_NAME}-OutputStack`,
    });

    const { fargateService } = props;

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
      description: 'The DNS name of the load balancer for accessing the Fargate service',
    });
  }
}

