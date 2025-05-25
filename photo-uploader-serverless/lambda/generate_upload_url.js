
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    const bucket = 'photo-uploader-demo-your-name';
    const key = `uploads/${Date.now()}-${event.queryStringParameters.filename}`;

    const params = {
        Bucket: bucket,
        Key: key,
        Expires: 60,
        ContentType: 'image/jpeg'
    };

    const uploadURL = await s3.getSignedUrlPromise('putObject', params);

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadURL, key })
    };
};
