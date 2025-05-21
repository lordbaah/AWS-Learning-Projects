import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const ses = new SESClient({ region: 'us-east-1' });

export const handler = async (event) => {
  // Log the incoming event for debugging
  console.log('Received event:', JSON.stringify(event, null, 2));

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
      'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
  };

  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: '',
      };
    }

    // Ensure event.body is present and properly handled
    if (!event.body) {
      console.log('Missing request body');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Request body is missing.' }),
      };
    }

    // Safely parse event.body
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
          message: 'Invalid JSON format.',
          error: err.message,
        }),
      };
    }

    // Check that body has expected properties
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
          message: 'Name, email, and message are required.',
          receivedFields: Object.keys(body || {}),
        }),
      };
    }

    const params = {
      Destination: {
        ToAddresses: ['lordbaah8@gmail.com'], //replace with receiver email
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
      Source: 'lord.baah@azubiafrica.org', //replace with sender email
    };

    const command = new SendEmailCommand(params);
    await ses.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Email sent successfully!' }),
    };
  } catch (error) {
    console.error('Unhandled error:', error);
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
