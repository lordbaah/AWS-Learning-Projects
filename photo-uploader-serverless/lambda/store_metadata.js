import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient({ region: 'us-east-1' });

export const handler = async (event) => {
  console.log('Received S3 event:', JSON.stringify(event, null, 2));

  try {
    // Process each record in the event
    for (const record of event.Records) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const size = record.s3.object.size;
      const eventTime = record.eventTime;

      console.log(`Processing file: ${key} from bucket: ${bucket}`);

      // Prepare DynamoDB item
      const params = {
        TableName: 'PhotoMetadata',
        Item: {
          photo_name: { S: key },
          bucket_name: { S: bucket },
          file_size: { N: size.toString() },
          upload_time: { S: eventTime },
          content_type: { S: record.s3.object.contentType || 'image/jpeg' },
        },
      };

      // Store metadata in DynamoDB
      const command = new PutItemCommand(params);
      await dynamodb.send(command);

      console.log(`Successfully stored metadata for: ${key}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Photo metadata stored successfully',
      }),
    };
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};
