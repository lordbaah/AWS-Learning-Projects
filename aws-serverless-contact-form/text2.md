AWS Serverless Contact Form
A complete guide to building and deploying a serverless contact form using AWS services (S3, Lambda, API Gateway, and SES).

Show Image
images/architecture-diagram.png

📋 Table of Contents

Introduction
Prerequisites
Architecture Overview
Step 1: Set Up Amazon SES
Step 2: Create IAM Policies and Roles
Step 3: Create Lambda Function
Step 4: Set Up API Gateway
Step 5: Host Frontend on S3
Step 6: Testing
Troubleshooting
Repository Structure
References

Introduction
This project demonstrates how to build a serverless contact form solution using AWS services. The contact form is hosted on Amazon S3 as a static website, and when a user submits the form, it triggers an API Gateway endpoint, which invokes a Lambda function to send an email via Amazon SES.
This solution is:

Cost-effective: You only pay for what you use
Scalable: Can handle varying loads automatically
Secure: Uses AWS IAM for permissions
Maintenance-free: No servers to manage

Prerequisites
Before you begin, make sure you have:

An AWS account
AWS Management Console access
Basic knowledge of HTML, CSS, and JavaScript
Basic understanding of AWS services
AWS CLI installed (optional but recommended)

Architecture Overview
Here's how the components work together:

User visits the contact form hosted on Amazon S3
User fills out and submits the form
Form submission sends a request to API Gateway
API Gateway triggers the Lambda function
Lambda function uses Amazon SES to send an email with the form data
Response is returned to the user

images/architecture-detailed.png

Step 1: Set Up Amazon SES
Since our Lambda function will send emails using Amazon SES, we need to set this up first.
Verify Email Addresses
When your AWS account is in SES sandbox mode (default for new accounts), you can only send emails to and from verified email addresses.

Navigate to the Amazon SES console
Select Email Addresses under Identity Management
Click Verify a New Email Address
Enter your sender email address and click Verify This Email Address
Repeat for your recipient email address

images/ses-verification.png

Check both email inboxes and click the verification links

📝 Note: To send emails to non-verified recipients, you need to request production access for SES. This is not covered in this guide.

Step 2: Create IAM Policies and Roles
Create IAM Policy for Lambda

1. Go to the IAM Console and click on Policies in the left sidebar
2. Click Create policy
3. Select the JSON tab
4. Paste the following policy:
   json
   {
   "Version": "2012-10-17",
   "Statement": [
   {
   "Effect": "Allow",
   "Action": "ses:SendEmail",
   "Resource": "*"
   }
   ]
   }
   link to json police file

images/iam-policy-creation.png

5. Click Next: Tags (optional)
6. Click Next: Review
7. Name the policy (e.g., LambdaSESSendEmailPolicy) and provide a description
8. Click Create policy

Create IAM Role for Lambda

1. In the IAM console, click on Roles in the left sidebar
2. Click Create role
3. Select AWS service as the trusted entity type
4. Select Lambda as the use case
5. Click Next: Permissions
6. Search for the policy you created earlier (LambdaSESSendEmailPolicy) and select it
7. Click Next: Tags (optional)
8. Click Next: Review
9. Name the role (e.g., ContactFormLambdaRole) and provide a description
10. Click Create role

images/iam-role-creation.png

Step 3: Create Lambda Function
Create the Function

1. Go to the AWS Lambda console
2. Click Create function
3. Select Author from scratch
4. Set the following:
   Function name: ContactFormHandler
   Runtime: Node.js 22.x
   Architecture: x86_64
   Permissions: Use an existing role
   Existing role: Select the role you created earlier (ContactFormLambdaRole)
5. Click Create function

images/lambda-creation.png

Add Function Code

1.  In the function code editor, create a new file named index.mjs (since we're using ES modules)
2.  Paste the following code:

link to lambda.js
Important: Replace the placeholder emails with your verified sender and recipient emails.

3. Click Deploy to save your function

images/lambda-code-editor.png

Test the Function

1.  Click Test in the Lambda console
2.  Create a new test event with the following JSON:

json {
"body": "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"message\":\"This is a test message.\"}"
}

3.  Name the test event (e.g., TestContactForm) and click Save
4.  Click Test to execute the function
5.  If everything is configured correctly, you should receive a success message

images/lambda-test-event.png

Step 4: Set Up API Gateway
Create REST API

1. Go to the API Gateway console
2. Click Create API
3. Select REST API (not REST API Private)
4. Click Build
5. Choose New API
6. Set the API name to ContactFormAPI and select Regional for the Endpoint Type
7. Click Create API

images/api-gateway-creation.png

Create Resource and Method

1.  Click Actions and select Create Resource
2.  Set Resource Name to contact
3.  Click Create Resource
4.  With the /contact resource selected, click Actions and select Create Method
5.  Select POST from the dropdown and click the checkmark
6.  Configure the POST method:

Integration type: Lambda Function
Lambda Proxy integration: Check this box
Lambda Function: Select the region and enter the function name (ContactFormHandler)

7.  Click Save
8.  When prompted to give API Gateway permission to invoke your Lambda function, click OK

images/api-gateway-method.png

Enable CORS

1.  Select the POST method under the /contact resource
2.  Click Actions and select Enable CORS
3.  Keep the default settings or customize as needed
4.  Click Enable CORS and replace existing CORS headers
5.  When prompted to confirm, click Yes, replace existing values

images/api-gateway-cors.png

Deploy the API

1.  Click Actions and select Deploy API
2.  For Deployment stage, select New Stage
3.  Set Stage name to prod
4.  Click Deploy
5.  Note the Invoke URL at the top of the page - you'll need this for your frontend

images/api-gateway-deployment.png

step 5: Test the API Endpoints
Test the Endpoint:
Use Thunder Client or Postman to send a POST request to the API endpoint:
Endpoint: POST https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/contact
Headers: Content-Type: application/json
Body:{
"name": "John Doe",
"email": "john@example.com",
"message": "Hello from the contact form!"
}
images/api-testing.png

Step 6: Host Frontend on S3
Create S3 Bucket

1.  Go to the S3 console
2.  Click Create bucket
    Enter a globally unique bucket name (e.g., contact-form-yourdomain-com)
    Select the region closest to your users
    Uncheck Block all public access
    Acknowledge the warning
    Keep the rest of the settings as default
    Click Create bucket

images/s3-bucket-creation.png

Enable Static Website Hosting

1.  Click on your newly created bucket
2.  Go to the Properties tab
    Scroll down to Static website hosting
    Click Edit
    Select Enable
    Set Index document to index.html
    Set Error document to error.html (optional)
    Click Save changes

images/s3-website-hosting.png

Create Bucket Policy

1.  Go to the Permissions tab
2.  Scroll down to Bucket policy
3.  Click Edit
4.  Paste the following policy (replace YOUR-BUCKET-NAME with your actual bucket name):
    json
    {
    "Version": "2012-10-17",
    "Statement": [
    {
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
    ]
    }

    link to policy file

5.  Click Save changes

images/s3-bucket-policy.png

Create and Upload Frontend Files
Create the following files locally:
link to frontend files
index.html:
⚠️ Important: Replace YOUR_API_GATEWAY_URL with the Invoke URL you noted from API Gateway, adding /contact at the end.

Upload Files to S3

In your S3 bucket, click Upload
Add the files you created (index.html, style.css, and optionally error.html)
Click Upload

images/s3-file-upload.png

Get Website URL

Go to the Properties tab
Scroll down to Static website hosting
Note the Bucket website endpoint - this is your contact form's URL

images/s3-website-url.png

Step 6: Testing

Open your S3 website URL in a web browser
Fill out the contact form with test data
Submit the form
You should see a success message and receive an email at your verified recipient address

images/form-testing.png

⚠️ Challenges Encountered & Fixes
❌ require is not defined in ES module scope
Issue: Node.js 22 does not support require() in ES module mode.

Solution: Use import instead of require for loading AWS SDK and other dependencies.

❌ SES Access Denied Error
Issue: If SES throws an "Access Denied" error.

Solution: Ensure that the email addresses you're sending from and to are verified in SES. If SES is in sandbox mode, only verified addresses can be used.

Lambda Execution Errors
If your Lambda function fails to execute:

Go to CloudWatch Logs to check the error messages
Common issues include:

Incorrect email addresses (not verified in SES)
IAM permissions issues
Syntax errors in your Lambda code

🔧 Final Notes
IAM Role Permissions: Make sure the IAM role used by Lambda has the proper permissions to send emails via SES.

SES in Sandbox: If you're in the SES sandbox, you'll need to verify both sender and recipient emails. You can apply for SES production access if you plan to send emails to unverified addresses.

## References

- [Amazon S3 Static Website Hosting Documentation](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
- [Amazon API Gateway Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- [Amazon SES Documentation](https://docs.aws.amazon.com/ses/latest/dg/Welcome.html)
- [AWS IAM Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
