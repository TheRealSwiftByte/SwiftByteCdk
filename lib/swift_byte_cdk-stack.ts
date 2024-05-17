import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export class SwiftByteCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const queue = new sqs.Queue(this, 'SwiftByteCdkQueue', {
      visibilityTimeout: Duration.seconds(300)
    });

    const topic = new sns.Topic(this, 'SwiftByteCdkTopic');

    topic.addSubscription(new subs.SqsSubscription(queue));
  }
}
