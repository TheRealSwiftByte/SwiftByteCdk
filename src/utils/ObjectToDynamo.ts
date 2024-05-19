
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
                result[key] = { L: element.map((item: any) => ObjectToDynamo(item)) };
            } else if (typeof element === 'object') {
                result[key] = { M: ObjectToDynamo(element) };
            }
        }
    }
    return result;
}