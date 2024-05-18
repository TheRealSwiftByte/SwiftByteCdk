import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, TransactWriteItemsCommand, TransactWriteItemsCommandInput } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        console.log('Received event:', JSON.stringify(event));
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid HTTP method' }),
            };
        }
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'No body provided' }),
            };
        }

        const requestBody = JSON.parse(event.body || '{"message": "No body"}');

        if (!requestBody.id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'No id provided' }),
            };
        }

        console.log('Received payload:', JSON.stringify(requestBody));

        const resource = event.resource;
        const dataClass = resource.replace(/\/+/g, "").toLowerCase();
        console.log('Path clean:', dataClass);

        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const writeCommandInput: TransactWriteItemsCommandInput = {
            TransactItems: [
                {
                    Put: {
                        TableName: TABLE_NAME,
                        Item: {
                            id: { S: requestBody.id },
                            dataClass: { S: dataClass || 'default' },
                            data: { S: requestBody.data || 'default'},
                        },
                    },
                },
            ],
        };

        const writeCommand = new TransactWriteItemsCommand(writeCommandInput);
        const result = await client.send(writeCommand);

        console.log('Result:', JSON.stringify(result));

        if (result.$metadata.httpStatusCode !== 200) {
            throw new Error('Internal server error when writing to table: ' + JSON.stringify(result));
        }


        return {
            statusCode: 200,
            body: JSON.stringify(result),
        };
    } catch (error) {
        console.error('Error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
}