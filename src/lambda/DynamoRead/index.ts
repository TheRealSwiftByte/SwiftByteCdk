import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    try {
        // Process the request here

        // Return a successful response with 'Hello World'
        return {
            statusCode: 200,
            body: 'Hello World',
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