const nodeMailer = require('nodemailer');

const dotenv = require('dotenv').config({path: '../config.env'});

async function nodeEmailer(args) {

    const transporter = nodeMailer.createTransport({
        host: process.env.BREVO_SMTP,
        port: process.env.BREVO_PORT,
        secure: false,
        auth: {     
          user: process.env.BREVO_USER,
          pass: process.env.BREVO_PASSWORD,
        },
      });

    const info = await transporter.sendMail({
        to: args.to, // Email of the recipient
        from: args.from, // This will be our verified sender
        subject: args.subject, // the subject title of the email
        html: args.html,
        text: args.text,
        attachments: args.attachments,                
    });

    console.log("Message sent: %s", info.messageId);
};    


exports.nodeEmailer = async (args) => {
    if(process.env.NODE_ENV === 'development') {
        return new Promise.resolve();
    }
    else {
        return nodeEmailer(args);
    }
};








