import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const dynamodb = new DynamoDBClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'photo-uploader-demo-[your-name]'; // Replace with your bucket name

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    const limit = parseInt(event.queryStringParameters?.limit) || 20;
    const generateUrls = event.queryStringParameters?.generateUrls === 'true';

    // Scan DynamoDB to get all photo metadata
    const scanParams = {
      TableName: 'PhotoMetadata',
      Limit: limit,
    };

    const command = new ScanCommand(scanParams);
    const result = await dynamodb.send(command);

    // Transform DynamoDB items to regular objects
    const photos = result.Items.map((item) => ({
      photo_name: item.photo_name.S,
      bucket_name: item.bucket_name.S,
      file_size: parseInt(item.file_size.N),
      upload_time: item.upload_time.S,
      content_type: item.content_type?.S || 'image/jpeg',
    }));

    // Generate presigned URLs for viewing images if requested
    if (generateUrls) {
      for (const photo of photos) {
        try {
          const getObjectCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: photo.photo_name,
          });

          const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
            expiresIn: 3600, // 1 hour
          });

          photo.viewUrl = signedUrl;
        } catch (error) {
          console.error(`Error generating URL for ${photo.photo_name}:`, error);
          photo.viewUrl = null;
        }
      }
    }

    // Sort by upload time (newest first)
    photos.sort((a, b) => new Date(b.upload_time) - new Date(a.upload_time));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        photos: photos,
        count: photos.length,
        message: 'Photos retrieved successfully',
      }),
    };
  } catch (error) {
    console.error('Error fetching photos:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to fetch photos',
        details: error.message,
      }),
    };
  }
};
