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
        if(!queryParamaters.email){
            throw new Error('No email provided');
        }
        if(!queryParamaters.password){
            throw new Error('No password provided');
        }


        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const restaurantScan: ScanCommandInput = {
            TableName: TABLE_NAME,
            FilterExpression: 'email = :email AND password = :password',
            ExpressionAttributeValues: {
                ':email': { S: queryParamaters.email },
                ':password': { S: queryParamaters.password }
            }
        };
        
        const results = await client.send(new ScanCommand(restaurantScan));

        if (!results.Items || results.Items.length === 0) {
            throw new Error('No restaurant found with provided login details');
        }

        if (results.Items.length > 1) {
            throw new Error('Multiple restaurants found with provided login details');
        }


        const restaurantDynamo = results.Items[0];
        const restaurant = DynamoToObject(restaurantDynamo);

        console.log("Results: ", results);

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
            body: JSON.stringify(restaurant),
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