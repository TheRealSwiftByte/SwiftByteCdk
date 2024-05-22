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

    const CustomerSignInLambda = new lambda.Function(this, 'SwiftByteCdkLambdaCustomerSignIn', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('./src/lambda/CustomerSignIn'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      }
    });
    dynamoTable.grantReadData(CustomerSignInLambda);

    const RestaurantSignInLambda = new lambda.Function(this, 'SwiftByteCdkLambdaRestaurantSignIn', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('./src/lambda/RestaurantSignIn'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      }
    });
    dynamoTable.grantReadData(RestaurantSignInLambda);

    const GetOrderByCustomerIdLambda = new lambda.Function(this, 'SwiftByteCdkLambdaGetOrderByCId', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('./src/lambda/GetOrderByCustomerId'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      }
    });
    dynamoTable.grantReadData(GetOrderByCustomerIdLambda);


    const GetOrderByRestaurantIdLambda = new lambda.Function(this, 'SwiftByteCdkLambdaGetOrderByRId', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      code: lambda.Code.fromAsset('./src/lambda/GetOrderByRestaurantId'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: dynamoTable.tableName,
      }
    });
    dynamoTable.grantReadData(GetOrderByRestaurantIdLambda);


    dynamoTable.grantReadData(getLambda);
    dynamoTable.grantReadWriteData(postLambda);
    dynamoTable.grantReadWriteData(updateLambda);

    const api = new apigateway.RestApi(this, 'SwiftByteCdkApi');

    const getLambdaIntegration = new apigateway.LambdaIntegration(getLambda);
    const postLambdaIntegration = new apigateway.LambdaIntegration(postLambda);
    const updateLambdaIntegration = new apigateway.LambdaIntegration(updateLambda);
    const CustomerSignInLambdaIntegration = new apigateway.LambdaIntegration(CustomerSignInLambda);
    const GetOrderByCustomerIdLambdaIntegration = new apigateway.LambdaIntegration(GetOrderByCustomerIdLambda);
    const GetOrderByRestaurantIdLambdaIntegration = new apigateway.LambdaIntegration(GetOrderByRestaurantIdLambda);
    const RestaurantSignInLambdaIntegration = new apigateway.LambdaIntegration(RestaurantSignInLambda);

    const customerResource = api.root.addResource('customer');
    customerResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT'],
    })
    customerResource.addMethod('GET', getLambdaIntegration);
    customerResource.addMethod('POST', postLambdaIntegration);
    customerResource.addMethod('PUT', updateLambdaIntegration);

    const orderResource = api.root.addResource('order');
    orderResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    })
    orderResource.addMethod('GET', getLambdaIntegration);
    orderResource.addMethod('POST', postLambdaIntegration);
    orderResource.addMethod('PUT', updateLambdaIntegration);

    const orderByIdResource = orderResource.addResource('fetch');
    // orderByIdResource.addCorsPreflight({
    //   allowOrigins: ['*'],
    //   allowMethods: ['GET'],
    // })
    orderByIdResource.addMethod('GET', GetOrderByCustomerIdLambdaIntegration);

    const restaurantResource = api.root.addResource('restaurant');
    restaurantResource.addMethod('GET', getLambdaIntegration);
    restaurantResource.addMethod('POST', postLambdaIntegration);
    restaurantResource.addMethod('PUT', updateLambdaIntegration);
    restaurantResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT'],
    })
    const orderByRestaurantIdResource = restaurantResource.addResource('fetch');
    orderByRestaurantIdResource.addMethod('GET', GetOrderByRestaurantIdLambdaIntegration);
    orderByIdResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    })

    const RestaurantSignInResource = restaurantResource.addResource('SignIn');
    RestaurantSignInResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    })
    RestaurantSignInResource.addMethod('GET', RestaurantSignInLambdaIntegration);


    const CustomerSignInResource = customerResource.addResource('SignIn');
    CustomerSignInResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    })
    CustomerSignInResource.addMethod('GET', CustomerSignInLambdaIntegration);

    // const MenuItemResource = restaurantResource.addResource('menuitem');
    // MenuItemResource.addMethod('GET', getLambdaIntegration);
    // MenuItemResource.addMethod('POST', postLambdaIntegration);
    // MenuItemResource.addMethod('PUT', updateLambdaIntegration);

    const reviewResource = api.root.addResource('review');
    reviewResource.addMethod('GET', getLambdaIntegration);
    reviewResource.addMethod('POST', postLambdaIntegration);
    reviewResource.addMethod('PUT', updateLambdaIntegration);

  }
}
