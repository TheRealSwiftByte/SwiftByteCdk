import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import {Table, AttributeType} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';


export class SwiftByteCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dynamoTable = new Table(this, 'SwiftByteCdkTable', {
      partitionKey: { name: 'id', type: AttributeType.STRING },
      sortKey: {name: 'dataClass', type: AttributeType.STRING},
    });

    const getLambda = new lambda.Function(this, 'SwiftByteCdkLambdaGet', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('./src/lambda/DynamoRead'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      }
    });

    const postLambda = new lambda.Function(this, 'SwiftByteCdkLambdaPost', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('./src/lambda/DynamoCreate'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      }
    });

    const updateLambda = new lambda.Function(this, 'SwiftByteCdkLambdaUpdate', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('./src/lambda/DynamoUpdate'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      }
    });

    dynamoTable.grantReadData(getLambda);
    dynamoTable.grantReadWriteData(postLambda);
    dynamoTable.grantReadWriteData(updateLambda);

    const api = new apigateway.RestApi(this, 'SwiftByteCdkApi');

    const getLambdaIntegration = new apigateway.LambdaIntegration(getLambda);
    const postLambdaIntegration = new apigateway.LambdaIntegration(postLambda);
    const updateLambdaIntegration = new apigateway.LambdaIntegration(updateLambda);

    const customerResource = api.root.addResource('customer');
    customerResource.addMethod('GET', getLambdaIntegration);
    customerResource.addMethod('POST', postLambdaIntegration);
    customerResource.addMethod('PUT', updateLambdaIntegration);

    const orderResource = api.root.addResource('order');
    orderResource.addMethod('GET', getLambdaIntegration);
    orderResource.addMethod('POST', postLambdaIntegration);
    orderResource.addMethod('PUT', updateLambdaIntegration);

    const restaurantResource = api.root.addResource('restaurant');
    restaurantResource.addMethod('GET', getLambdaIntegration);
    restaurantResource.addMethod('POST', postLambdaIntegration);
    restaurantResource.addMethod('PUT', updateLambdaIntegration);

    const MenuItemResource = restaurantResource.addResource('menuitem');
    MenuItemResource.addMethod('GET', getLambdaIntegration);
    MenuItemResource.addMethod('POST', postLambdaIntegration);
    MenuItemResource.addMethod('PUT', updateLambdaIntegration);


  }
}
