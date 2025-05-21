const AWS = require('aws-sdk');
const ses = new AWS.SES();

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { name, email, message } = body;

        const params = {
            Destination: {
                ToAddresses: ["recipient@example.com"],
            },
            Message: {
                Body: {
                    Text: {
                        Data: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
                    },
                },
                Subject: {
                    Data: "New Contact Form Submission",
                },
            },
            Source: "sender@example.com",
        };

        await ses.sendEmail(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Email sent successfully!' }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to send email.' }),
        };
    }
};