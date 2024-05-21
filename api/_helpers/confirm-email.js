const sendEmail = require('./send-email');
const config = require('../config/config');

module.exports = confirmEmail;

async function confirmEmail(toEmail, firstName, verifyUrl) {
    const emailTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
        div.header {
            background-color: #602eaa;
            width: 100%;
            height: 88px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            font-size: 24px;
        }
        div.footer {
            background-color: whitesmoke;
            width: 75%;
            padding: 20px 30px;
            color: darkslategrey;
            margin: auto;
        }
        div.nice {
            width: 75%;
            padding: 15px 30px;
            margin: auto;
        }
        h1 {
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <a href="${config.appLoginUrl}">
            <img src="${config.imagesUrl}/assets/app-logo-white.png" height="24px" alt="logo-img">
        </a>
    </div>
    <h1>Verify your email address</h1>
    <div class="nice">
        <p>Dear ${firstName},</p>
        <p>Verifying your email address helps us to confirm we have the right email address to send you important
            messages about your Mentor Application account.</p>
        <p>To complete the email verification process, please click on the link below or go to </p>
        <p><a href="${verifyUrl}">Verify Email Address</a></p>
        <p>If you didn’t make this request or you feel that your account may have been accessed by someone else, please
            let us know.</p>
    </div>
    <div class="footer">
        <p>Please do not respond to this message. This email was sent from an unattended mailbox.</p>
        <p>© 2023 Mentor Application. The content of this message is protected by copyright and trademark laws under U.S. and
            international law. All rights reserved.</p>
        <p>Thank you for your business.</p>
    </div>
</body>
</html>`;

    await sendEmail({
        to: toEmail,
        subject: 'Verify your email address',
        html: emailTemplate
    });
}
