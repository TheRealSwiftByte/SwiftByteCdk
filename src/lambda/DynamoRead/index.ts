import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, TransactGetItemsCommand, TransactGetItemsCommandInput } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        // Process the request here
        console.log('Processing event: ', event);
        const eventPayload = event;

        const path = eventPayload.path;
        console.log('Path: ', path);
        const queryParamaters = eventPayload.queryStringParameters;

        if (!queryParamaters){ 
            throw new Error('No query parameters provided');
        }
        
        console.log('Query Parameters: ', queryParamaters);

        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const readCommandInput: TransactGetItemsCommandInput = {
            TransactItems: [
                {
                    Get: {
                        TableName: TABLE_NAME,
                        Key: {
                            id: { S: queryParamaters.id ?? '1' },
                            dataClass: { S: queryParamaters.dataClass ?? 'default' },
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
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
}

/**
 * 
 */