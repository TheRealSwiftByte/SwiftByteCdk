import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb';


const TABLE_NAME = process.env.TABLE_NAME || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        console.log('Processing event: ', event);
        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const orderScan: ScanCommandInput = {
            TableName: TABLE_NAME,
            FilterExpression: 'dataClass = :dataClass',
            ExpressionAttributeValues: {
                ':dataClass': { S: 'restaurant' }
            }
        };
        
        const results = await client.send(new ScanCommand(orderScan));

        if (!results.Items || results.Items.length === 0) {
            throw new Error('No restaurants found');
        }

        //variables misleading, leaving to save time. Actually processes restaurants
        const orderDynamo = results.Items;
        const orders = orderDynamo.map((orderDynamo: any) => DynamoToObject(orderDynamo));

        console.log("Results: ", results);
        console.log("Items stringified: ", orderDynamo);
        console.log("Orders: ", orders);


        if (results.$metadata.httpStatusCode !== 200) {
            throw new Error('Internal server error when reading from table: ' + JSON.stringify(results));
        }
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'GET'
            },
            body: JSON.stringify(orders),
        };
    } catch (error) {
        // Handle any errors that occur during processing
        console.error('Error: ', error);
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