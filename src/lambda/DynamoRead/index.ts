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
        

        return {
            statusCode: 200,
            body: JSON.stringify(results),
        };
    } catch (error) {
        // Handle any errors that occur during processing

        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error: ' + error}),
        };
    }
}