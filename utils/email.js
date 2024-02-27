const nodemailer = require('nodemailer');

module.exports = async (options) => {
  // Create a transporter - a service that will send the email
  var transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_HOST,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });

  //Email options
  const mailOptions = {
    from: 'Jaskaran Singh <dmdn@test.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html :
  };

  //Send the email, returns promise
  await transporter.sendMail(mailOptions);
};
