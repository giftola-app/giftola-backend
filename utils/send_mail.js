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
                  <img src="https://uc7ce4b8fa06a4c8ba9331032e3a.previews.dropboxusercontent.com/p/thumb/AB4s6SnrbLDcI0i3in2PM95da8iAb893ARXvajdb9w0p2FbXvDM3Z895MQhg3rSpbMssbEs3pmjs3YCJfZfZqvA9S4tJT-2ewwXNouzodajRQ402fizo9-QeEwIi7Xf6w4OYX52opIq_4Dco5pRK8_WHajNtgQQkPdsQl2fh7Uvnl4tK16wNDPPzlt7RPj-iadn7Y87wyBFewCNU0RP6ujctWw50-Acb_Uxq2pXmrTPoUFASxhKh3EEo3ibeQvilBexmB17kr0LweyV4gltqtLXQvRZXz04Zdph6y87uusVa7m9vT49K7uwI5k-7aBOE1K9II0TGUYv4AF7Ch9kNeAp0rFa1qovwEdddyylvaA5gHld-oDqWw5xsdPq4-O2GwgI/p.jpeg" alt="Giftola logo" height="100" style="display: block;">
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

const sendGroupInvite = async (
  email,
  name,
  groupName,
  acceptInvitationLink
) => {
  const senderEmail = "Giftola < info@giftola.com>";
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
                <img src="https://uc7ce4b8fa06a4c8ba9331032e3a.previews.dropboxusercontent.com/p/thumb/AB4s6SnrbLDcI0i3in2PM95da8iAb893ARXvajdb9w0p2FbXvDM3Z895MQhg3rSpbMssbEs3pmjs3YCJfZfZqvA9S4tJT-2ewwXNouzodajRQ402fizo9-QeEwIi7Xf6w4OYX52opIq_4Dco5pRK8_WHajNtgQQkPdsQl2fh7Uvnl4tK16wNDPPzlt7RPj-iadn7Y87wyBFewCNU0RP6ujctWw50-Acb_Uxq2pXmrTPoUFASxhKh3EEo3ibeQvilBexmB17kr0LweyV4gltqtLXQvRZXz04Zdph6y87uusVa7m9vT49K7uwI5k-7aBOE1K9II0TGUYv4AF7Ch9kNeAp0rFa1qovwEdddyylvaA5gHld-oDqWw5xsdPq4-O2GwgI/p.jpeg" alt="Giftola logo" height="100" style="display: block;">
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

module.exports = { sendVerificationOTP, sendGroupInvite };
