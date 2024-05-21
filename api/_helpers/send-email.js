const sgMail = require('@sendgrid/mail');
const config = require('../config/config');

sgMail.setApiKey(config.sendGrid.apiKey);

module.exports = sendEmail;

async function sendEmail(dto) {
    const operationId = 'sendEmail';
    console.log(`${operationId}: entered`);
    try {
        const msg = {
            to: dto.to,
            cc: dto.cc || [],
            bcc: dto.bcc || [],
            from: {
                name: config.sendGrid.fromName,
                email: dto.from ?? config.sendGrid.fromAddress
            },
            subject: dto.subject,
            html: dto.html
        };
        if (dto.attachment && dto.attachment.file) {
            msg['attachments'] = [ {filename: dto.attachment.fileName, content: dto.attachment.file} ];
        }

        await sgMail.send(msg);
        console.log(`${operationId}: email sent`);
    } catch (err) {
        console.error(`${operationId} error: ${err}`);
        throw err;
    }
}
