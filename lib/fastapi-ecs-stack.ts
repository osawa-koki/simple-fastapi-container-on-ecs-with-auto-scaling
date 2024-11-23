import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as dotenv from 'dotenv';

import NetworkStack from './network/network';
import ComputeStack from './compute/compute';
import OutputStack from './output/output';
import { BASE_STACK_NAME } from './const';

dotenv.config();

export class FastapiEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      stackName: BASE_STACK_NAME,
    });

    const networkStack = new NetworkStack(this, 'NetworkStack');

    const computeStack = new ComputeStack(this, 'ComputeStack', {
      vpc: networkStack.vpc,
    });

    new OutputStack(this, 'OutputStack', {
      fargateService: computeStack.fargateService,
    });
  }
}
