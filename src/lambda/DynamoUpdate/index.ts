import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, TransactWriteItemsCommand, TransactWriteItemsCommandInput } from '@aws-sdk/client-dynamodb';

const TABLE_NAME = process.env.TABLE_NAME || '';

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

        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const updateItemInput: TransactWriteItemsCommandInput = {
            TransactItems: [
                {
                    Update: {
                        TableName: TABLE_NAME,
                        Key: {
                            id: { S: queryStringParameters.id || '1' },
                            dataClass: { S: queryStringParameters.dataClass || 'default' },
                        },
                        UpdateExpression: 'set #data = :data',
                        ExpressionAttributeNames: {
                            '#data': 'data',
                        },
                        ExpressionAttributeValues: {
                            ':data': { S: requestBody || 'default' },
                        },
                    },
                },
            ],
        };

        const results = await client.send(new TransactWriteItemsCommand(updateItemInput));

        if (results.$metadata.httpStatusCode !== 200) {
            throw new Error('Internal server error when updating item: ' + JSON.stringify(results));
        }

        return {
            statusCode: 200,
            body: 'We hear you',
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
        };
    }
}