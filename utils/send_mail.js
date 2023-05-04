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
                  <img src="https://uc3f76b19a4ff054b3b94ec699e1.previews.dropboxusercontent.com/p/thumb/AB52BPfRyaqMGjXlHT6Rqv-bdlUPHHBBcysxbUJUNicKzl3iWnJXw3CVo5P5xVFm3ipFVLNqDNR4limWq2tUeVpplHqkZGOGZe7pOK0RsVonEnt9XD0vnopU-17jam41OD7ZCBOaZqMu5mMEu149mjOiEAJyXhxCCRxnd1qMiSYgX4K0JP5f72iB6_Z06YXR-96uakfvQxGhScSMaJ2VhP79n_WQVchqT1ATpIFALDpHTP5dhy7FxVdMNAWHz4IFJyor8tWwMgZlDU8RW_IEn9QUqCfV0V2NTrhtosRcGEAoWZMZ6jZyv9S2biBXEnHqvif2CZN13yF6QTqE2FxLpmMS-QRyniJgCeacviJec75L6VHhFPtMNwWCYAYX-p8zGzo/p.png?size=512x512&size_mode=1" alt="Giftola logo" height="100" style="display: block;">
                </td>
              </tr>
              <tr>
                <td align="center" valign="top" style="padding: 10px;">
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
