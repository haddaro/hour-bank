const nodemailer = require('nodemailer');

const FROM_NAME = 'Hour-Bank';
const FROM_EMAIL = 'admin@hour-bank.com';

const handleEmail = async (mailOptions) => {
  //create a nodemailer transporter:
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    //Send mail via transporter with the options accepted as parameter:
  });
  await transporter.sendMail(mailOptions);
};

module.exports = async (receiver, subjectLine, message) => {
  const mailOptions = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: receiver,
    subject: subjectLine,
    text: message,
  };
  await handleEmail(mailOptions);
};
