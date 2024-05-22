import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDBClient, TransactWriteItem, TransactWriteItemsCommand, TransactWriteItemsCommandInput } from '@aws-sdk/client-dynamodb';
import { CreateCustomerInput, CreateOrderInput, CreateRestaurantInput, CreateReviewInput, Customer, Order, Restaurant, Review } from '../../types';

const TABLE_NAME = process.env.TABLE_NAME || '';

const CreateFunctionGenerator = {
    "customer": createCustomer,
    "order": createOrder,
    "restaurant": createRestaurant,
    "review": createReview,
};

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

        console.log('Received payload:', JSON.stringify(requestBody));

        const resource = event.resource;
        const dataClass = resource.replace(/\/+/g, "").toLowerCase();
        const CreateFunction = CreateFunctionGenerator[dataClass as keyof typeof CreateFunctionGenerator];

        if (!CreateFunction) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid data class' }),
            };
        }

        const createdObject = CreateFunction(requestBody);
        const objectToDynamo = ObjectToDynamo(createdObject);
        objectToDynamo.id = { S: createdObject.id };
        objectToDynamo.dataClass = { S: dataClass };

        console.log('Object to write:', JSON.stringify(objectToDynamo));

        const client = new DynamoDBClient({ region: 'ap-southeast-2' });

        const writeCommandInput: TransactWriteItemsCommandInput = {
            TransactItems: [
                {
                    Put: {
                        TableName: TABLE_NAME,
                        Item: objectToDynamo,
                    },
                },
            ],
        };
        const writeCommand = new TransactWriteItemsCommand(writeCommandInput);
        console.log("Write Command: ", writeCommand);

        try {
            const result = await client.send(writeCommand);
            console.log('Result:', JSON.stringify(result));
            if (result.$metadata.httpStatusCode !== 200) {
                throw new Error('Internal server error when writing to table: ' + JSON.stringify(result));
            }
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT'
                },
                body: JSON.stringify(createdObject),
            };
        } catch (error) {
            console.error('Error sending to dynamo table:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'Internal server error triggered when writing to dynamo table', error: error }),
            };
        }
        
    } catch (error) {
        console.error('Error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error', error: error }),
        };
    }
}

function createCustomer(inputObject: CreateCustomerInput): Customer {
    return {
        id: Math.random().toString(36).substring(2, 8),
        firstName: inputObject.firstName || 'default',
        lastName: inputObject.lastName || 'default',
        email: inputObject.email || 'default',
        phone: inputObject.phone || 'default',
        address: inputObject.address || 'default',
        password: inputObject.password || 'default',
    } as Customer
}

function createOrder(inputObject: CreateOrderInput): Order {
    const outputObject: Order = {

        id: Math.random().toString(36).substring(2, 8),
        customerId: inputObject.customerId || 'default',
        restaurant: inputObject.restaurant || {},
        foodItems: inputObject.foodItems || [],
        orderStatus: inputObject.orderStatus || 'default',
        totalPrice: inputObject.totalPrice || -1,
        orderDate: Date.now(),
        deliveryInstruction: inputObject.deliveryInstruction || 'default',
        deliveryAddress: inputObject.deliveryAddress || 'default',
    };
    if (inputObject.payment) {
        outputObject.payment = inputObject.payment;
    }
    return outputObject;
}

function createRestaurant(inputObject: CreateRestaurantInput): Restaurant {
    return {
        id: Math.random().toString(36).substring(2, 8),
        name: inputObject.name || 'default',
        categories: inputObject.categories || [],
        address: inputObject.address || 'default',
        phone: inputObject.phone || 'default',
        description: inputObject.description || 'default',
        menu: inputObject.menu || [], //should be checking if all menu items but oh well
        averageRating: inputObject.averageRating || -1,
        averageWaitTime: inputObject.averageWaitTime || -1,
    } as Restaurant;
}

function createReview(inputObject: CreateReviewInput): Review {
    return {
        id: Math.random().toString(36).substring(2, 8),
        customerId: inputObject.customerId || 'default',
        restaurantId: inputObject.restaurantId || 'default',
        rating: inputObject.rating || -1,
        comment: inputObject.comment || 'default',
        createdAt: Date.now(),
    } as Review;
}


function ObjectToDynamo(obj: any): any {
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
                result[key] = { L: element.map((item: any) => ObjectToDynamo(item)) };
            } else if (typeof element === 'object') {
                result[key] = { M: ObjectToDynamo(element) };
            }
        }
    }
    return result;
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
