import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, TransactWriteItemsCommand, TransactWriteItemsCommandInput, Update } from '@aws-sdk/client-dynamodb';
import { Customer, UpdateCustomerInput, Order, UpdateOrderInput, Restaurant, UpdateRestaurantInput, Review, UpdateReviewInput } from '../../types';


const TABLE_NAME = process.env.TABLE_NAME || '';

const UpdateFunctionGenerator = {
    "customer": updateCustomer,
    "order": updateOrder,
    "restaurant": updateRestaurant,
    "review": updateReview,
};

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        console.log('Received event:', event);

        const queryStringParameters = event.queryStringParameters;
        console.log('Query string parameters:', queryStringParameters);

        const requestBody = JSON.parse(event.body || "{}");

        if (!queryStringParameters) {
            return {
                statusCode: 400,
                body: 'Invalid request',
            };
        }
        if (!queryStringParameters.id) {
            return {
                statusCode: 400,
                body: 'No id provided',
            };
        }
        if (!event.body) {
            return {
                statusCode: 400,
                body: 'No body provided, unknown data to update',
            };
        }
        
        const resource = event.resource;
        const dataClass = resource.replace(/\/+/g, "").toLowerCase();
        console.log('Path clean:', dataClass);

        const UpdateFunction = UpdateFunctionGenerator[dataClass as keyof typeof UpdateFunctionGenerator];
        const dataToUpdate = UpdateFunction(requestBody);
        const processedData = ObjectToDynamo(dataToUpdate);

        let updateExpression = 'set';
        for (const key in processedData) {
            updateExpression += ` ${key} = :${key},`;
        }
        updateExpression = updateExpression.slice(0, -1);

        let expressionAttributeValues: Record<string, any> = {};
        for (const key in processedData) {
            expressionAttributeValues[`:${key}`] = processedData[key];
        }


        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const updateItemInput: TransactWriteItemsCommandInput = {
            TransactItems: [
                {
                    Update: {
                        TableName: TABLE_NAME,
                        Key: {
                            id: { S: queryStringParameters.id || '1' },
                            dataClass: { S: dataClass || 'default' },
                        },
                        UpdateExpression: updateExpression,
                        ExpressionAttributeValues: expressionAttributeValues,
                    },
                },
            ],
        };

        console.log('Update item input:', JSON.stringify(updateItemInput));

        try {
            const results = await client.send(new TransactWriteItemsCommand(updateItemInput));
            console.log('Results:', JSON.stringify(results));

            if (results.$metadata.httpStatusCode !== 200) {
                throw new Error('Internal server error when updating item: ' + JSON.stringify(results));
            }
    
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT'
                },
                body: JSON.stringify(results),
            };
        } catch (error) {
            throw new Error('Internal server error when updating item: ' + error);
        }
       
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET'
            },
        };
    }
}

function updateCustomer(inputObject: any): UpdateCustomerInput {
    const outputObject: UpdateCustomerInput = {};
    for (const key in inputObject) {
        outputObject[key as keyof UpdateCustomerInput] = inputObject[key];
    }
    return outputObject;
}

function updateOrder(inputObject: any): UpdateOrderInput {
    const outputObject: UpdateOrderInput = {};
    for (const key in inputObject) {
        outputObject[key as keyof UpdateOrderInput] = inputObject[key];
    }
    return outputObject;
}

function updateRestaurant(inputObject: any): UpdateRestaurantInput {
    const outputObject: UpdateRestaurantInput = {};
    for (const key in inputObject) {
        outputObject[key as keyof UpdateRestaurantInput] = inputObject[key];
    }
    return outputObject;
}

function updateReview(inputObject: any): UpdateReviewInput {
    const outputObject: UpdateReviewInput = {};
    for (const key in inputObject) {
        outputObject[key as keyof UpdateReviewInput] = inputObject[key];
    }
    return outputObject;
}
export function DynamoToObject(dynamo:any):any {
    let result: Record<string, any> = {};
    for (const key in dynamo) {
        if (dynamo.hasOwnProperty(key)) {
            const element = dynamo[key];
            if (element.S) {
                result[key] = element.S;
            } else if (element.N) {
                result[key] = Number(element.N);
            } else if (element.BOOL) {
                result[key] = element.BOOL;
            } else if (element.L) {
                result[key] = element.L.map((item: any) => {
                    if (item.M){
                        return DynamoToObject(item.M);
                    } else {
                        return DynamoToObject(item);
                    }
                });
            } else if (element.M) {
                result[key] = DynamoToObject(element.M);
            }
        }
    }
    return result;
}

export function ObjectToDynamo(obj: any): any {
    let result: Record<string, any> = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const element = obj[key];
            if (typeof element === 'string') {
                result[key] = { S: element };
            } else if (typeof element === 'number') {
                result[key] = { N: element.toString() };
            } else if (typeof element === 'boolean') {
                result[key] = { BOOL: element };
            } else if (Array.isArray(element)) {
                result[key] = { L: element.map((item: any) => {
                    if (typeof item === 'object'){
                        return { M: ObjectToDynamo(item) }
                    }
                    return ObjectToDynamo(item) 
                })
            };
            } else if (typeof element === 'object') {
                result[key] = { M: ObjectToDynamo(element) };
            }
        }
    }
    return result;
}