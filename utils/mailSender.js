const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use any email service
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const sendMail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL,
            to,
            subject,
            html,
        };
        
        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.log('Error sending email:', error);
        throw error;
    }
};

module.exports = sendMail;
