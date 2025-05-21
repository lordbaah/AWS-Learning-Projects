import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: 'us-east-1' });

export const handler = async (event) => {
  // Log the incoming event and request context for debugging
  console.log('Received event:', JSON.stringify(event, null, 2));
  console.log(
    'Request context:',
    JSON.stringify(event.requestContext || {}, null, 2)
  );

  // CORS headers needed for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' }),
    };
  }

  try {
    // Check if event.body exists and handle different integration types
    if (!event.body) {
      console.log('Request body is missing');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Request body is missing.',
          event: JSON.stringify(event),
        }),
      };
    }

    // Parse the request body
    let body;
    try {
      body =
        typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      console.log('Parsed body:', JSON.stringify(body, null, 2));
    } catch (err) {
      console.log('Failed to parse body:', event.body);
      console.log('Parse error:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Invalid JSON format in request body.',
          error: err.message,
          receivedBody: event.body,
        }),
      };
    }

    // Check required fields
    const { name, email, message } = body || {};
    if (!name || !email || !message) {
      console.log(
        'Missing required fields. Received:',
        JSON.stringify(body, null, 2)
      );
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          message: 'Name, email, and message are required fields.',
          receivedFields: Object.keys(body || {}),
        }),
      };
    }

    // Send email using SES
    const params = {
      Destination: {
        ToAddresses: ['YOUR_RECIPIENT_EMAIL'], // Replace with your verified recipient email
      },
      Message: {
        Body: {
          Text: {
            Data: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
          },
        },
        Subject: {
          Data: 'New Contact Form Submission',
        },
      },
      Source: 'YOUR_SENDER_EMAIL', // Replace with your verified sender email
    };

    const command = new SendEmailCommand(params);
    await ses.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Email sent successfully!',
        status: 'success',
      }),
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: 'Failed to send email.',
        error: error.message || 'Unknown error',
      }),
    };
  }
};
