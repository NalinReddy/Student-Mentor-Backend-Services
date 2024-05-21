const sendEmail = require('../send-email');
const config = require('../../config/config');

module.exports = passwordResetEmail;

async function passwordResetEmail(toEmail, resetToken) {
    console.log(`entered passwordResetEmail`);
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
        div.content {
            padding: 15px 30px;
        }
        div.wide-content {
            max-width: 75%;
            margin: auto;
        }
        div.centered-content {
            max-width: 50%;
            text-align: center;
            margin: auto;
        }
        h1 {
            text-align: center;
        }
        img {
            padding: 0px 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <a href="${config.appLoginUrl}">
            <img src="${config.imagesUrl}/assets/app-logo-white.png" height="24px" alt="logo-img">
        </a>
    </div>
    <h1>Password Reset</h1>
    <div class="content">
        <div class="wide-content">
            <p>
                Please use the below code to reset your password. This code will be valid for 1 day.
                <p>
                    <h2><code>${resetToken}</code><h2>
                </p>
            </p>
        </div>
    </div>
    <div class="footer">
        <p>Please do not respond to this message. This email was sent from an unattended mailbox.</p>
        <p>© 2023 Mentor APP. The content of this message is protected by copyright and trademark laws under U.S. and
            international law. All rights reserved.</p>
        <p>Thank you for your business.</p>
    </div>
</body>
</html>`;
    console.log(`sending passwordResetEmail`);

    await sendEmail({
        to: toEmail,
        subject: `Password Reset Verification`,
        html: emailTemplate
    });
    console.log(`passwordResetEmail sent`);
}
