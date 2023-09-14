const nodemailer = require("nodemailer");
const sendMail = async (options) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });
    transporter.verify((error, success) => {
        if (error) {
            console.log("Error in Mail Transporter")
        } else {
            console.log("Mail Server is running")
        }
    });
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    await transporter.sendMail(mailOptions);
}
module.exports = sendMail
