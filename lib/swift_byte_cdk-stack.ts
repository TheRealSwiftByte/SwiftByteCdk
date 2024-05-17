import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class SwiftByteCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaFunction = new lambda.Function(this, 'SwiftByteCdkLambda', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('./src/lambda/DynamoRead'),
      handler: 'index.handler',
    });

    const api = new apigateway.RestApi(this, 'SwiftByteCdkApi');
    const integration = new apigateway.LambdaIntegration(lambdaFunction);
    const resource = api.root.addResource('myresource');
    resource.addMethod('GET', integration);

  }
}
