import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, TransactGetItemsCommand, TransactGetItemsCommandInput } from '@aws-sdk/client-dynamodb';


const TABLE_NAME = process.env.TABLE_NAME || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        console.log('Processing event: ', event);
        const eventPayload = event;
        const pathUrl = eventPayload.path;
        const queryParamaters = eventPayload.queryStringParameters;

        if (!queryParamaters){ 
            throw new Error('No query parameters provided');
        }
        if(!queryParamaters.id){
            throw new Error('No id provided');
        }
        
        const resource = event.resource;
        const dataClass = resource.replace(/\/+/g, "").toLowerCase();
        console.log('Path clean:', dataClass);

        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const readCommandInput: TransactGetItemsCommandInput = {
            TransactItems: [
                {
                    Get: {
                        TableName: TABLE_NAME,
                        Key: {
                            id: { S: queryParamaters.id ?? '1' },
                            dataClass: { S: dataClass ?? 'default' },
                        },
                    }
                }
            ]
        };
        
        const results = await client.send(new TransactGetItemsCommand(readCommandInput));

        if (results.$metadata.httpStatusCode !== 200) {
            throw new Error('Internal server error when reading from table: ' + JSON.stringify(results));
        }

        if (!results.Responses || results.Responses.length === 0) {
            console.error('No items found');
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'No items found' }),
            };
        }

        if (results.Responses.length > 1) {
            console.error('Multiple items found, this should not happen');
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Multiple items found, this should not happen' }),
            };
        }

        const dynamoItem = results.Responses[0].Item;
        const parsedItem = DynamoToObject(dynamoItem);

        console.log("Returned item: ", parsedItem);
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET'
            },
            body: JSON.stringify(parsedItem),
        };
    } catch (error) {
        // Handle any errors that occur during processing

        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error: ' + error}),
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET'
            },
        };
    }
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