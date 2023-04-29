const nodemailer = require("nodemailer");

const sendEmailVerificationLink = async (email, name, verficationLink) => {
  const senderEmail = "Welcome to Giftola <info@giftola.com>";
  const subject = "Verify your email address";
  const content = `<p>Hi ${name}, welcome to Giftola!</p> 
  Click <a href="${verficationLink}">here</a> to verify your email address.`;

  await sendMail(email, senderEmail, subject, content);
};

const sendMail = async (email, senderEmail, subject, content) => {
  const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: senderEmail,
    to: email,
    subject: subject,
    html: content,
  });
  return info;
};

module.exports = { sendEmailVerificationLink };
