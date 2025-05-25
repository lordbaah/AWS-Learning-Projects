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

[View Lambda Function Code](./lambda/store_metadata.js)

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

[View Lambda Function Code](./lambda/generate_upload_url.js)

### Step 7: Create Image Fetching Lambda Function

Create a Lambda function to fetch and list uploaded images:

1. **Lambda Console** → **Create function**

   - **Function name**: `fetchUserImages`
   - **Runtime**: Node.js 18.x
   - **Execution role**: `LambdaS3DynamoDBRole`

2. Lambda function code:

   [View Lambda Function Code](./lambda/fetch_images.js)

### Step 8: Create API Gateway

1. Go to **API Gateway Console** → **Create API** → **HTTP API**
2. **Add integrations**:
   - **Integration 1**: Lambda function → `generateUploadURL`
   - **Integration 2**: Lambda function → `fetchUserImages`
3. **Configure routes**:
   - **Method**: GET, **Resource path**: `/upload-url`
   - **Method**: GET, **Resource path**: `/images`
4. **Deploy** and note the invoke URL

### Step 9: Create S3 Bucket for Frontend Hosting

1. **Create Frontend Bucket**:

   - Go to S3 Console → **Create bucket**
   - **Bucket name**: `photo-uploader-frontend-[your-name]`
   - **Region**: Same as your main bucket
   - **Uncheck** "Block all public access"
   - Click **Create bucket**

2. **Enable Static Website Hosting**:

   - Go to bucket **Properties** tab
   - Scroll to **Static website hosting** → **Edit**
   - **Enable** static website hosting
   - **Index document**: `index.html`
   - **Error document**: `error.html`
   - **Save changes**

3. **Add Bucket Policy for Public Access**:
   - Go to **Permissions** tab → **Bucket policy** → **Edit**
   - Add this policy (replace bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::photo-uploader-frontend-[your-name]/*"
    }
  ]
}
```

### Step 10: Frontend Application Files

The Frontend code is located in this folder[Go to Frontend Folder](./frontend/)

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
