import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'photo-uploader-demo-[your-name]'; // Replace with your bucket name

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Extract filename from query parameters
    const filename =
      event.queryStringParameters?.filename || `upload-${Date.now()}.jpg`;
    const contentType =
      event.queryStringParameters?.contentType || 'image/jpeg';

    // Create S3 key with uploads prefix
    const key = `uploads/${filename}`;

    // Create presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      Metadata: {
        'uploaded-by': 'photo-uploader-app',
      },
    });

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        uploadUrl: signedUrl,
        key: key,
        message: 'Presigned URL generated successfully',
      }),
    };
  } catch (error) {
    console.error('Error generating presigned URL:', error);

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Failed to generate upload URL',
        details: error.message,
      }),
    };
  }
};
