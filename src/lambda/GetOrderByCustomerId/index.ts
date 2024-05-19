import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, ScanCommand, ScanCommandInput } from '@aws-sdk/client-dynamodb';


const TABLE_NAME = process.env.TABLE_NAME || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        console.log('Processing event: ', event);
        const eventPayload = event;
        const queryParamaters = eventPayload.queryStringParameters;

        if (!queryParamaters){ 
            throw new Error('No query parameters provided');
        }
        if(!queryParamaters.id){
            throw new Error('No id provided');
        }


        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const orderScan: ScanCommandInput = {
            TableName: TABLE_NAME,
            FilterExpression: 'customerId = :customerId AND dataClass = :dataClass',
            ExpressionAttributeValues: {
                ':customerId': { S: queryParamaters.id },
                ':dataClass': { S: 'order' }
            }
        };
        
        const results = await client.send(new ScanCommand(orderScan));

        if (!results.Items || results.Items.length === 0) {
            throw new Error('No orders found with provided login details');
        }

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
            body: JSON.stringify(orders),
        };
    } catch (error) {
        // Handle any errors that occur during processing
        console.error('Error: ', error);
        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error: ' + error}),
        };
    }
}

function DynamoToObject(dynamo:any):any {
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
                result[key] = element.L.map((item: any) => DynamoToObject(item));
            } else if (element.M) {
                result[key] = DynamoToObject(element.M);
            }
        }
    }
    return result;
}