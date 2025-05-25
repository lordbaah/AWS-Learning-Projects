
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log("S3 Event: ", JSON.stringify(event, null, 2));
    
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const size = record.s3.object.size;
        const time = new Date().toISOString();

        const params = {
            TableName: 'PhotoMetadata',
            Item: {
                photo_name: key,
                bucket: bucket,
                size: size,
                upload_time: time
            }
        };

        try {
            await dynamodb.put(params).promise();
            console.log(`Metadata saved for ${key}`);
        } catch (err) {
            console.error("Error saving metadata: ", err);
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify('Metadata stored.')
    };
};
