const nodemailer = require("nodemailer");

const sendVerificationOTP = async (email, name, otp) => {
  const senderEmail = "Welcome to Giftola <info@giftola.com>";
  const subject = "Verify your account";
  const content = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <title>Welcome to Giftola!</title>
    </head>
    <body style="background-color: #f7f7f7; font-family: Arial, sans-serif; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
        <tr>
          <td align="center" valign="top" style="padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); color: #444444;">
              <tr>
                <td align="center" valign="top" style="padding: 20px;">
                  <img src="https://giftola.com/logo.png" alt="Giftola logo" width="150" height="50" style="display: block;">
                </td>
              </tr>
              <tr>
                <td align="center" valign="top" style="padding: 20px;">
                  <p style="font-size: 18px; line-height: 1.5em;">Hi ${name},</p>
                  <p style="font-size: 18px; line-height: 1.5em;">Welcome to Giftola!</p>
                  <p style="font-size: 18px; line-height: 1.5em;">Please enter the following OTP to verify your account:</p>
                  <p style="font-size: 24px; line-height: 1.5em; font-weight: bold;">${otp}</p>
                  <p style="font-size: 18px; line-height: 1.5em;">This OTP will expire in ${process.env.OTP_EXPIRES_IN_MINUTES} minutes.</p>
                </td>
              </tr>
              <tr>
                <td align="center" valign="top" style="padding: 20px;">
                  <p style="font-size: 14px; line-height: 1.5em;">If you did not create an account with us, please ignore this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

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

module.exports = { sendVerificationOTP };
