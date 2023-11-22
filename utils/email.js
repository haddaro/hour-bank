/* Handles the sending of e-mails through nodemailer,
   from host, port, user and password specified in environment variables.
*/
const nodemailer = require('nodemailer');

const FROM_NAME = 'Hour-Bank';
const FROM_EMAIL = 'admin@hour-bank.com';

const handleEmail = async (mailOptions) => {
  console.log(1);
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  console.log(2);
  await transporter.sendMail(mailOptions);
  console.log(3);
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
