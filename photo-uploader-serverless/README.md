# Photo Uploader with S3 + Lambda + DynamoDB + CloudFront

A serverless photo uploader application using AWS services with CloudFront distribution for frontend hosting and API endpoints for testing.

## 🎯 Objective

Build a serverless photo uploader that:

- Allows users to upload images to an S3 bucket via API
- Triggers a Lambda function when a new image is uploaded
- Stores metadata (image name, size, upload time) in DynamoDB
- Hosts frontend via CloudFront distribution
- Provides REST APIs for testing with Postman/Thunder Client

## 🏗️ Architecture

```
[CloudFront] --> [S3 Frontend Bucket]
[API Gateway] --> [Lambda Functions] --> [S3 Images Bucket] --> [DynamoDB]
```

## 🛠️ Services Used

- **Amazon CloudFront** - CDN for frontend hosting
- **Amazon S3** - Frontend hosting and image storage
- **AWS Lambda** - Processing uploads and metadata
- **Amazon DynamoDB** - Image metadata storage
- **API Gateway** - REST API endpoints for testing

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 18.x or later
- Postman or Thunder Client for API testing

## 🚀 Step-by-Step Setup

### Step 1: Create S3 Buckets

#### Main Images Bucket

1. Go to **AWS S3 Console**
2. Click **Create bucket**
   - **Bucket name**: `photo-uploader-images-[your-name]`
   - **Region**: `us-east-1`
   - **Block Public Access**: Keep enabled (we'll use presigned URLs)
3. Click **Create bucket**

#### Frontend Hosting Bucket

1. **Create Frontend Bucket**:
   - **Bucket name**: `photo-uploader-frontend-[your-name]`
   - **Region**: `us-east-1`
   - **Block Public Access**: Uncheck all options
2. Click **Create bucket**

3. **Add Bucket Policy for CloudFront**:
   - Go to **Permissions** tab → **Bucket policy**
   - Add CloudFront service principal policy (will be provided by CloudFront OAC setup)

### Step 2: Create DynamoDB Table

1. Go to **DynamoDB Console**
2. Click **Create table**
   - **Table name**: `PhotoMetadata`
   - **Partition key**: `photo_id` (String)
   - **Sort key**: `upload_timestamp` (Number)
3. Click **Create table**

### Step 3: Create IAM Role for Lambda

1. Go to **IAM Console** → **Roles** → **Create role**
2. Select **AWS service** → **Lambda**
3. Create custom policy with the following permissions:
   - S3 full access to images bucket
   - DynamoDB full access to PhotoMetadata table
   - CloudWatch Logs permissions
4. **Role name**: `PhotoUploaderLambdaRole`
5. Click **Create role**

### Step 4: Create Lambda Functions

#### Function 1: Generate Upload URL

1. **Lambda Console** → **Create function**

   - **Function name**: `generateUploadURL`
   - **Runtime**: Node.js 18.x
   - **Execution role**: `PhotoUploaderLambdaRole`

2. **Function code**: [View Lambda Function Code](./lambda/generate_upload_url.js)

#### Function 2: Store Photo Metadata (S3 Trigger)

1. **Lambda Console** → **Create function**

   - **Function name**: `storePhotoMetadata`
   - **Runtime**: Node.js Latest version
   - **Execution role**: `PhotoUploaderLambdaRole`

2. **Function code**: [View Lambda Function Code](./lambda/store_metadata.js)

#### Function 3: Fetch Images

1. **Lambda Console** → **Create function**

   - **Function name**: `fetchUserImages`
   - **Runtime**: Node.js 18.x
   - **Execution role**: `PhotoUploaderLambdaRole`

2. **Function code**: [View Lambda Function Code](./lambda/fetch_images.js)

### Step 5: Configure S3 Event Notification

1. Go to your images S3 bucket → **Properties** tab
2. Scroll to **Event notifications** → **Create event notification**
   - **Event name**: `TriggerMetadataFunction`
   - **Event types**: `All object create events`
   - **Prefix**: `uploads/`
   - **Destination**: Lambda function → `storePhotoMetadata`
3. **Save changes**

### Step 6: Create API Gateway

1. Go to **API Gateway Console** → **Create API** → **HTTP API**
2. **Add integrations**:

   - Add Lambda integration for `generateUploadURL`
   - Add Lambda integration for `fetchUserImages`

3. **Configure routes**:

   - **GET** `/upload-url` → `generateUploadURL`
   - **GET** `/images` → `fetchUserImages`

4. **Configure CORS**:

   - **Access-Control-Allow-Origin**: `*`
   - **Access-Control-Allow-Headers**: `Content-Type, Authorization`
   - **Access-Control-Allow-Methods**: `GET, POST, OPTIONS`

5. **Deploy** and note the invoke URL (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com`)

### Step 7: Create Frontend Files

#### Frontend Application

- **Frontend code**: [View Frontend Code](./frontend/)
- Update the `API_ENDPOINT` variable with your API Gateway URL
- Upload the HTML file to your frontend S3 bucket

### Step 8: Create CloudFront Distribution

1. **Upload Frontend to S3**:

   - Upload `index.html` to your frontend S3 bucket

2. **Create CloudFront Distribution**:

   - Go to **CloudFront Console** → **Create distribution**
   - **Origin Domain**: Select your frontend S3 bucket
   - **Origin Access**: Origin access control settings (recommended)
   - **Default Root Object**: `index.html`
   - **Price Class**: Use all edge locations
   - Click **Create distribution**

3. **Update Bucket Policy** (if using OAC):

   - CloudFront will provide the bucket policy
   - Replace the existing policy in your frontend S3 bucket

4. **Note the CloudFront URL** (e.g., `https://d123456789.cloudfront.net`)

### Step 9: Update Frontend Configuration

Update the `API_ENDPOINT` in your `index.html`:

```javascript
const API_ENDPOINT = 'https://your-api-id.execute-api.us-east-1.amazonaws.com';
```

Re-upload the updated `index.html` to S3 and invalidate CloudFront cache.

## 🧪 API Testing with Postman/Thunder Client

### 1. Get Upload URL

**Request:**

```
GET https://your-api-id.execute-api.us-east-1.amazonaws.com/upload-url?filename=test-image.jpg&contentType=image/jpeg
```

**Expected Response:**

```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "filename": "uploads/1703123456789-test-image.jpg",
  "expiresIn": 300
}
```

### 2. Upload Image to S3

**Request:**

```
PUT [uploadUrl from previous response]
Content-Type: image/jpeg
Body: [Raw binary image data]
```

### 3. Get Images List

**Request:**

```
GET https://your-api-id.execute-api.us-east-1.amazonaws.com/images?generateUrls=true&limit=10
```

**Expected Response:**

```json
{
  "images": [
    {
      "photo_id": "uploads/1703123456789-test-image.jpg",
      "upload_timestamp": 1703123456789,
      "bucket_name": "photo-uploader-images-yourname",
      "file_size": 245760,
      "content_type": "image/jpeg",
      "upload_date": "2023-12-21T10:30:56.789Z",
      "viewUrl": "https://s3.amazonaws.com/..."
    }
  ],
  "count": 1,
  "timestamp": "2023-12-21T10:35:00.000Z"
}
```

## 📊 Testing Checklist

### Backend API Testing

- [ ] **Upload URL Generation**: Test GET `/upload-url` with filename parameter
- [ ] **S3 Upload**: Use presigned URL to upload image file
- [ ] **Metadata Storage**: Verify Lambda function triggers and stores metadata
- [ ] **Image Fetching**: Test GET `/images` endpoint
- [ ] **CORS Headers**: Verify all endpoints return proper CORS headers

### Frontend Testing

- [ ] **CloudFront Access**: Verify frontend loads via CloudFront URL
- [ ] **File Upload**: Test drag-and-drop functionality
- [ ] **Gallery Loading**: Verify images display in gallery
- [ ] **Error Handling**: Test error scenarios
- [ ] **Responsive Design**: Test on different screen sizes

### AWS Services Verification

- [ ] **S3 Images Bucket**: Verify uploaded files appear in `uploads/` folder
- [ ] **DynamoDB**: Check `PhotoMetadata` table for metadata records
- [ ] **Lambda Logs**: Monitor CloudWatch logs for all functions
- [ ] **API Gateway**: Test endpoints directly in AWS console

## 📊 Monitoring and Debugging

### CloudWatch Logs

- **Lambda Logs**: Monitor function execution and errors
- **API Gateway Logs**: Track API requests and responses
- **CloudFront Logs**: Monitor CDN performance and access patterns

### Common Issues and Solutions

1. **CORS Errors**: Ensure API Gateway has proper CORS configuration
2. **Permission Issues**: Verify IAM roles have correct policies
3. **S3 Event Not Triggering**: Check event notification configuration
4. **DynamoDB Errors**: Verify table name and key structure
5. **Images Not Loading**: Check S3 bucket permissions and presigned URL generation
6. **CloudFront Cache**: Remember to invalidate cache after frontend updates
7. **Gallery Not Refreshing**: Verify the `/images` API endpoint is working

## 🎯 Deliverables Checklist

- [ ] S3 buckets created and configured (images + frontend)
- [ ] DynamoDB table with proper schema
- [ ] Lambda functions processing uploads and API requests
- [ ] IAM roles with appropriate permissions
- [ ] S3 event notifications configured
- [ ] API Gateway with proper CORS configuration
- [ ] CloudFront distribution for frontend hosting
- [ ] Upload at least 3 test photos via API
- [ ] Verify metadata storage in DynamoDB
- [ ] Test image viewing via frontend
- [ ] Verify presigned URLs work correctly
- [ ] Frontend application accessible via CloudFront
- [ ] Complete API testing with Postman/Thunder Client

## 🔗 Important URLs to Note

- **CloudFront Distribution URL**: `https://d123456789.cloudfront.net`
- **API Gateway Base URL**: `https://your-api-id.execute-api.us-east-1.amazonaws.com`
- **S3 Frontend Bucket**: `photo-uploader-frontend-[your-name]`
- **S3 Images Bucket**: `photo-uploader-images-[your-name]`

## 🚀 Advanced Extensions

1. **Image Thumbnails**: Use Sharp library to create thumbnails
2. **Image Analysis**: Integrate with AWS Rekognition
3. **User Authentication**: Add Cognito integration
4. **Real-time Updates**: Use WebSockets for live upload status
5. **CDN Optimization**: Configure CloudFront caching strategies
6. **Multi-region**: Deploy across multiple AWS regions

## 💡 Cost Optimization Tips

- Use S3 Intelligent Tiering for image storage
- Set DynamoDB to On-Demand billing for development
- Monitor CloudFront usage and costs
- Set up CloudWatch billing alerts
- Use CloudFront edge caching effectively

## 🚨 Security Best Practices

- Use presigned URLs with short expiration times
- Implement file type validation in Lambda
- Add file size limits
- Monitor for unusual usage patterns
- Use CloudTrail for API access logging
- Secure CloudFront with proper headers

## 🔗 Useful Resources

- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3 Event Notifications](https://docs.aws.amazon.com/AmazonS3/latest/userguide/NotificationHowTo.html)
- [Lambda with S3](https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html)
- [DynamoDB JavaScript Examples](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GettingStarted.JavaScript.html)
- [CloudFront Distribution Setup](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/)

---

**Remember to:**

1. Replace `[your-name]` with your actual identifier
2. Update all API endpoints with your specific AWS resource URLs
3. Test each component individually before integration testing
4. Monitor CloudWatch logs for troubleshooting
5. Invalidate CloudFront cache when updating frontend files
