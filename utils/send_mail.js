// const nodemailer = require("nodemailer");
const axios = require("axios");

const settingsCollection = "settings";
const settingsDoc = "giftola-settings";

const appLogo =
  "https://firebasestorage.googleapis.com/v0/b/giftola-4b95c.appspot.com/o/giftola-favicon.png?alt=media&token=3188bc94-30eb-4551-84b9-f1d4dbe7f7f7";

const sendVerificationOTP = async (db, email, name, otp) => {
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
                  <img src="${appLogo}" alt="Giftola logo" height="100" style="display: block;">
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

  await sendMail(db, email, subject, content);
};

const sendGroupInvite = async (
  db,
  email,
  name,
  groupName,
  acceptInvitationLink
) => {
  const subject = "You have been invited to a group";
  const content = ` 
  <!DOCTYPE html>
  <html>

  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>You have been invited to a group</title>
  </head>

  <body style="background-color: #f7f7f7; font-family: Arial, sans-serif; margin: 0; padding: 0;">
    <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
      <tr>
        <td align="center" valign="top" style="padding: 20px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); color: #444444;">
            <tr>
              <td align="center" valign="top" style="padding: 20px;">
                <img src="${appLogo}" alt="Giftola logo" height="100" style="display: block;">
              </td>
            </tr>
            <tr>
              <td align="center" valign="top" style="padding: 10px;">
                <p style="font-size: 18px; line-height: 1.5em;">Hi ${name},</p>
                <p style="font-size: 18px; line-height: 1.5em;">You have been invited to join the group ${groupName}.</p>
                <p style="font-size: 18px; line-height: 1.5em;">Please click the button below to accept the invitation.</p>
              </td>
            </tr>
            <tr>
              <td align="center" valign="top" style="padding: 20px;">
                <a href="${acceptInvitationLink}" style="background-color: #0085ff; border: 1px solid #0085ff; border-radius: 4px; color: #ffffff; display: inline-block; font-size: 18px; font-weight: bold; line-height: 1.5em; padding: 10px 20px; text-align: center; text-decoration: none;">Accept Invitation</a>
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
  await sendMail(db, email, subject, content);
};

const sendForgotPasswordEmail = async (db, email, name, otp) => {
  const subject = "Forgot Password";
  const content = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
      <title>Giftola - Forgot Password</title>
    </head>
    <body style="background-color: #f7f7f7; font-family: Arial, sans-serif; margin: 0; padding: 0;">
      <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
        <tr>
          <td align="center" valign="top" style="padding: 20px 0;">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); color: #444444;">
              <tr>
                <td align="center" valign="top" style="padding: 20px;">
                  <img src="${appLogo}" alt="Giftola logo" height="100" style="display: block;">
                </td>
              </tr>
              <tr>
                <td align="center" valign="top" style="padding: 10px;">
                  <p style="font-size: 18px; line-height: 1.5em;">Hi ${name},</p>
                  <p style="font-size: 18px; line-height: 1.5em;">You have requested to reset your password.</p>
                  <p style="font-size: 18px; line-height: 1.5em;">Please enter the following OTP to reset your password:</p>
                  <p style="font-size: 24px; line-height: 1.5em; font-weight: bold;">${otp}</p>
                  <p style="font-size: 18px; line-height: 1.5em;">This OTP will expire in ${process.env.OTP_EXPIRES_IN_MINUTES} minutes.</p>
                </td>
              </tr>
              <tr>
                <td align="center" valign="top" style="padding: 20px;">
                  <p style="font-size: 14px; line-height: 1.5em;">If you didn't request a password reset, please ignore this email.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  await sendMail(db, email, subject, content);
};

const sendAppInvite = async (db, email, invitedBy) => {
  const subject = "Giftola - Join Today";
  const content = `
  <!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Giftola - Invitation</title>
</head>

<body style="background-color: #f7f7f7; font-family: Arial, sans-serif; margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
    <tr>
      <td align="center" valign="top" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600"
          style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); color: #444444;">
          <tr>
            <td align="center" valign="top" style="padding: 20px;">
              <img src="${appLogo}" alt="Giftola logo" height="100" style="display: block;">
            </td>
          </tr>
          <tr>
            <td align="center" valign="top" style="padding: 10px;">
              <p style="font-size: 18px; line-height: 1.5em;">Hi,</p>
              <p style="font-size: 18px; line-height: 1.5em;">You have been invited to join Giftola by ${invitedBy}.</p>
              <p style="font-size: 18px; line-height: 1.5em;">Giftola is a social gifting platform that allows you to create groups with your friends and family and send gifts to each other.</p>
             
            </td>
          </tr>
          <
          <tr>
            <td align="center" valign="top" style="padding: 20px;">
              <!-- Dummy links for Google Play and App Store logos -->
              <a href="#"><img src="https://www.freepnglogos.com/uploads/play-store-logo-png/play-store-logo-nisi-filters-australia-11.png" alt="Google Play Logo" height="40"
                  style="display: block; margin-bottom: 10px;"></a>
              <a href="#"><img src="https://cdn.freebiesupply.com/logos/large/2x/download-on-the-app-store-apple-logo-png-transparent.png" alt="App Store Logo" height="40" style="display: block;"></a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>

</html>

  `;

  await sendMail(db, email, subject, content);
};

const sendTestEmail = async (db) => {
  const subject = "Test Email";
  const content = `This is a test email sent from Giftola. If you are seeing this, it means that the email service is working fine.`;
  const email = "saad.dev@yopmail.com";

  await sendMail(db, email, subject, content);
};

const sendMail = async (db, email, subject, content) => {
  const senderEmail = "support@giftola.app";
  const senderName = "Giftola Support";
  const settingsRef = await db
    .collection(settingsCollection)
    .doc(settingsDoc)
    .get();

  if (!settingsRef.exists) {
    throw new BadRequestError("Settings does not exist");
  }
  const settingsData = settingsRef.data();
  const brevoApiKey = settingsData.BREVO_KEY;

  const response = await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          email: email,
        },
      ],
      subject: subject,
      htmlContent: content,
    },

    {
      headers: {
        "api-key": brevoApiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
    }
  );

  return response;
};

module.exports = {
  sendVerificationOTP,
  sendGroupInvite,
  sendForgotPasswordEmail,
  sendAppInvite,
  sendTestEmail,
};
