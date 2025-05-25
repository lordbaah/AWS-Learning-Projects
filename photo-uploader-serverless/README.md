# Photo Uploader with S3 + Lambda + DynamoDB

A serverless photo uploader application using AWS services with Node.js ES modules.

## 🎯 Objective

Build a simple serverless photo uploader that:

- Allows users to upload images to an S3 bucket
- Triggers a Lambda function when a new image is uploaded
- Stores metadata (image name, size, upload time) in DynamoDB

## 🏗️ Architecture

```
[User] --(Upload Photo)--> [S3 Bucket] --> [Lambda Function] --> [DynamoDB Table]
```

## 🛠️ Services Used

- **Amazon S3** - Stores uploaded image files
- **AWS Lambda** - Processes uploads and stores metadata
- **Amazon DynamoDB** - Stores image metadata
- **API Gateway** - Provides upload endpoints (optional)

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional)
- Node.js 18.x or later
- Basic knowledge of JavaScript ES modules

## 🚀 Step-by-Step Setup

### Step 1: Create S3 Bucket

1. Go to **AWS S3 Console**
2. Click **Create bucket**
   - **Bucket name**: `photo-uploader-demo-[your-name]`
   - **Region**: `us-east-1` (recommended)
   - **Block Public Access**: Uncheck if you want public image viewing
3. Click **Create bucket**

### Step 2: Create DynamoDB Table

1. Go to **DynamoDB Console**
2. Click **Create table**
   - **Table name**: `PhotoMetadata`
   - **Partition key**: `photo_name` (String)
   - Leave other settings as default
3. Click **Create table**

### Step 3: Create IAM Role for Lambda

1. Go to **IAM Console** → **Roles** → **Create role**
2. Select **AWS service** → **Lambda**
3. Attach the following policies:
   - `AmazonS3ReadOnlyAccess`
   - `AmazonDynamoDBFullAccess`
   - `AWSLambdaBasicExecutionRole`
4. **Role name**: `LambdaS3DynamoDBRole`
5. Click **Create role**

### Step 4: Create Lambda Function for Metadata Storage

1. Go to **Lambda Console** → **Create function**

   - **Function name**: `storePhotoMetadata`
   - **Runtime**: Node.js 18.x
   - **Execution role**: Use existing role → `LambdaS3DynamoDBRole`

2. Replace the default code with:

```javascript
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
```

3. Click **Deploy**

### Step 5: Configure S3 Event Notification

1. Go to your S3 bucket → **Properties** tab
2. Scroll to **Event notifications** → **Create event notification**
   - **Event name**: `TriggerMetadataFunction`
   - **Event types**: Select `All object create events`
   - **Prefix**: `uploads/` (optional - organizes uploads)
   - **Suffix**: `.jpg,.png,.jpeg` (filter for image files)
   - **Destination**: Lambda function → Select `storePhotoMetadata`
3. **Save changes**

### Step 6: Create Presigned URL Generator

For secure uploads, create another Lambda function:

1. **Lambda Console** → **Create function**

   - **Function name**: `generateUploadURL`
   - **Runtime**: Node.js 18.x
   - **Execution role**: `LambdaS3DynamoDBRole`

2. Add S3 write permissions to the role:
   - Go to IAM → Roles → `LambdaS3DynamoDBRole`
   - Add inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::photo-uploader-demo-[your-name]/*"
    }
  ]
}
```

3. Lambda function code:

```javascript
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
```

### Step 7: Create Image Fetching Lambda Function

Create a Lambda function to fetch and list uploaded images:

1. **Lambda Console** → **Create function**

   - **Function name**: `fetchUserImages`
   - **Runtime**: Node.js 18.x
   - **Execution role**: `LambdaS3DynamoDBRole`

2. Lambda function code:

```javascript
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
```

### Step 8: Create API Gateway

1. Go to **API Gateway Console** → **Create API** → **HTTP API**
2. **Add integrations**:
   - **Integration 1**: Lambda function → `generateUploadURL`
   - **Integration 2**: Lambda function → `fetchUserImages`
3. **Configure routes**:
   - **Method**: GET, **Resource path**: `/upload-url`
   - **Method**: GET, **Resource path**: `/images`
4. **Deploy** and note the invoke URL

### Step 9: Create Frontend Application

Create an `index.html` file:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Photo Uploader</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f5f5f5;
      }
      .container {
        background: white;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      .upload-area {
        border: 2px dashed #ccc;
        border-radius: 10px;
        padding: 40px;
        text-align: center;
        margin: 20px 0;
        transition: border-color 0.3s;
      }
      .upload-area:hover {
        border-color: #007bff;
      }
      .upload-btn {
        background: #007bff;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
      }
      .upload-btn:hover {
        background: #0056b3;
      }
      .progress {
        width: 100%;
        height: 20px;
        background: #f0f0f0;
        border-radius: 10px;
        overflow: hidden;
        margin: 10px 0;
        display: none;
      }
      .progress-bar {
        height: 100%;
        background: #007bff;
        width: 0%;
        transition: width 0.3s;
      }
      .status {
        margin: 10px 0;
        padding: 10px;
        border-radius: 5px;
      }
      .success {
        background: #d4edda;
        color: #155724;
      }
      .error {
        background: #f8d7da;
        color: #721c24;
      }

      .gallery {
        margin-top: 30px;
      }

      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 20px;
        margin-top: 20px;
      }

      .image-card {
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: transform 0.2s;
      }

      .image-card:hover {
        transform: translateY(-2px);
      }

      .image-card img {
        width: 100%;
        height: 200px;
        object-fit: cover;
      }

      .image-info {
        padding: 15px;
      }

      .image-name {
        font-weight: bold;
        margin-bottom: 5px;
        word-break: break-word;
      }

      .image-meta {
        font-size: 12px;
        color: #666;
        margin: 3px 0;
      }

      .refresh-btn {
        background: #28a745;
        color: white;
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-left: 10px;
      }

      .refresh-btn:hover {
        background: #218838;
      }

      .loading {
        text-align: center;
        padding: 20px;
        color: #666;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>📸 Photo Uploader</h1>
      <p>Upload your photos to AWS S3 with automatic metadata storage</p>

      <div class="upload-area" id="uploadArea">
        <p>Drag and drop images here or click to select</p>
        <input
          type="file"
          id="fileInput"
          accept="image/*"
          multiple
          style="display: none;"
        />
        <button
          class="upload-btn"
          onclick="document.getElementById('fileInput').click()"
        >
          Choose Images
        </button>
      </div>

      <div class="progress" id="progressContainer">
        <div class="progress-bar" id="progressBar"></div>
      </div>

      <div id="status"></div>

      <div id="uploadedImages"></div>

      <div class="gallery">
        <h2>📷 Your Photo Gallery</h2>
        <button class="refresh-btn" onclick="loadGallery()">
          🔄 Refresh Gallery
        </button>
        <div id="galleryContainer">
          <div class="loading">Loading your photos...</div>
        </div>
      </div>
    </div>

    <script>
      // Replace with your API Gateway URL
      const API_ENDPOINT =
        'https://your-api-id.execute-api.us-east-1.amazonaws.com/upload-url';

      const fileInput = document.getElementById('fileInput');
      const uploadArea = document.getElementById('uploadArea');
      const progressContainer = document.getElementById('progressContainer');
      const progressBar = document.getElementById('progressBar');
      const status = document.getElementById('status');
      const uploadedImages = document.getElementById('uploadedImages');

      // Drag and drop functionality
      uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007bff';
      });

      uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ccc';
      });

      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ccc';
        const files = Array.from(e.dataTransfer.files).filter((file) =>
          file.type.startsWith('image/')
        );
        if (files.length > 0) {
          uploadFiles(files);
        }
      });

      fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          uploadFiles(files);
        }
      });

      async function uploadFiles(files) {
        showStatus('Preparing uploads...', 'info');
        progressContainer.style.display = 'block';

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const progress = ((i + 1) / files.length) * 100;

          try {
            await uploadFile(file);
            progressBar.style.width = progress + '%';
            showStatus(`Uploaded ${i + 1}/${files.length} files`, 'success');
          } catch (error) {
            showStatus(
              `Error uploading ${file.name}: ${error.message}`,
              'error'
            );
            console.error('Upload error:', error);
          }
        }

        showStatus(`Successfully uploaded ${files.length} file(s)!`, 'success');

        // Refresh gallery after upload
        setTimeout(() => {
          loadGallery();
          progressContainer.style.display = 'none';
          progressBar.style.width = '0%';
        }, 2000);
      }

      async function uploadFile(file) {
        // Get presigned URL
        const response = await fetch(
          `${API_ENDPOINT}/upload-url?filename=${encodeURIComponent(
            file.name
          )}&contentType=${encodeURIComponent(file.type)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get upload URL');
        }

        // Upload file to S3
        const uploadResponse = await fetch(data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file to S3');
        }

        // Add to uploaded images display
        addUploadedImage(file.name, data.key);
      }

      function addUploadedImage(filename, key) {
        const imageDiv = document.createElement('div');
        imageDiv.style.cssText =
          'margin: 10px 0; padding: 10px; background: #e9ecef; border-radius: 5px;';
        imageDiv.innerHTML = `
                <strong>📁 ${filename}</strong><br>
                <small>S3 Key: ${key}</small><br>
                <small>Uploaded: ${new Date().toLocaleString()}</small>
            `;
        uploadedImages.appendChild(imageDiv);
      }

      function showStatus(message, type) {
        status.innerHTML = `<div class="status ${type}">${message}</div>`;
      }

      // Gallery functions
      async function loadGallery() {
        try {
          galleryContainer.innerHTML =
            '<div class="loading">Loading your photos...</div>';

          const response = await fetch(
            `${API_ENDPOINT}/images?generateUrls=true&limit=50`
          );
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Failed to load images');
          }

          displayGallery(data.photos);
        } catch (error) {
          console.error('Error loading gallery:', error);
          galleryContainer.innerHTML = `<div class="status error">Failed to load gallery: ${error.message}</div>`;
        }
      }

      function displayGallery(photos) {
        if (!photos || photos.length === 0) {
          galleryContainer.innerHTML =
            '<div class="status">No photos uploaded yet. Upload some images to see them here!</div>';
          return;
        }

        const galleryGrid = document.createElement('div');
        galleryGrid.className = 'gallery-grid';

        photos.forEach((photo) => {
          const imageCard = document.createElement('div');
          imageCard.className = 'image-card';

          const fileName = photo.photo_name.split('/').pop(); // Remove path prefix
          const fileSize = formatFileSize(photo.file_size);
          const uploadDate = new Date(photo.upload_time).toLocaleDateString();
          const uploadTime = new Date(photo.upload_time).toLocaleTimeString();

          imageCard.innerHTML = `
                    ${
                      photo.viewUrl
                        ? `<img src="${photo.viewUrl}" alt="${fileName}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+'" />`
                        : '<div style="height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">No Preview Available</div>'
                    }
                    <div class="image-info">
                        <div class="image-name">📸 ${fileName}</div>
                        <div class="image-meta">📏 Size: ${fileSize}</div>
                        <div class="image-meta">📅 Uploaded: ${uploadDate}</div>
                        <div class="image-meta">🕒 Time: ${uploadTime}</div>
                    </div>
                `;

          galleryGrid.appendChild(imageCard);
        });

        galleryContainer.innerHTML = '';
        galleryContainer.appendChild(galleryGrid);
      }

      function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }

      // Load gallery when page loads
      window.addEventListener('load', loadGallery);
    </script>
  </body>
</html>
```

## 🧪 Testing Your Application

### Manual Testing via AWS Console

1. **Upload Test Image**:

   - Go to S3 Console → Your bucket
   - Upload a `.jpg` or `.png` file to the `uploads/` folder

2. **Verify Lambda Execution**:

   - Go to Lambda Console → `storePhotoMetadata` → Monitor tab
   - Check recent invocations

3. **Check DynamoDB**:

   - Go to DynamoDB Console → `PhotoMetadata` table
   - Explore table items to see stored metadata

4. **Test Image Fetching**:
   - Go to Lambda Console → `fetchUserImages` → Test tab
   - Create a test event and verify it returns photo metadata

### Frontend Testing

1. Update the `API_ENDPOINT` in `index.html` with your API Gateway URL (without `/upload-url` suffix)
2. Open `index.html` in a web browser
3. Upload images using drag-and-drop or file selection
4. View uploaded images in the gallery section
5. Verify uploads in S3 and metadata in DynamoDB

### API Testing with curl

```bash
# Test upload URL generation
curl "https://your-api-id.execute-api.us-east-1.amazonaws.com/upload-url?filename=test.jpg"

# Test image fetching
curl "https://your-api-id.execute-api.us-east-1.amazonaws.com/images?generateUrls=true&limit=10"
```

## 📊 Monitoring and Debugging

### CloudWatch Logs

- **Lambda Logs**: Monitor function execution and errors
- **API Gateway Logs**: Track API requests and responses

### Common Issues and Solutions

1. **CORS Errors**: Ensure API Gateway has proper CORS configuration
2. **Permission Issues**: Verify IAM roles have correct policies
3. **S3 Event Not Triggering**: Check event notification configuration
4. **DynamoDB Errors**: Verify table name and key structure
5. **Images Not Loading**: Check S3 bucket permissions and presigned URL generation
6. **Gallery Not Refreshing**: Verify the `/images` API endpoint is working

## 🎯 Deliverables Checklist

- [ ] S3 bucket created and configured
- [ ] DynamoDB table with proper schema
- [ ] Lambda function processing S3 events
- [ ] IAM roles with appropriate permissions
- [ ] S3 event notifications configured
- [ ] Upload at least 3 test photos
- [ ] Verify metadata in DynamoDB
- [ ] Test image viewing in gallery
- [ ] Verify presigned URLs work correctly
- [ ] Frontend application working
- [ ] Architecture diagram
- [ ] Demo of upload and viewing process

## 🚀 Advanced Extensions

1. **Image Thumbnails**: Use Sharp library to create thumbnails
2. **Image Analysis**: Integrate with AWS Rekognition
3. **User Authentication**: Add Cognito integration
4. **Real-time Updates**: Use WebSockets for live upload status
5. **Image Gallery**: Build a React/Vue frontend to display images

## 💡 Cost Optimization Tips

- Use S3 Intelligent Tiering for cost-effective storage
- Set DynamoDB to On-Demand billing for development
- Monitor Lambda execution time and memory usage
- Use CloudWatch to track usage and costs

## 🔗 Useful Resources

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/NotificationHowTo.html)
- [Lambda with S3](https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html)
- [DynamoDB JavaScript Examples](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.JavaScript.html)

---

**Note**: Replace `[your-name]` with your actual identifier and update all endpoint URLs with your specific AWS resource URLs.
