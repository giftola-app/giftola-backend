const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");

const usersCollection = "users";

const { sendAppInvite } = require("../utils/send_mail");

const createAppInvite = async (req, res) => {
  const { email } = req.query;
  const { db, user } = req;

  if (!email) {
    throw new BadRequestError("Please provide email");
  }

  const userRef = db.collection(usersCollection).doc(email);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    throw new BadRequestError("User already exists");
  }

  await sendAppInvite(db, email, user.name);

  res.status(StatusCodes.OK).json({
    code: "create_app_invite",
    message: "Invite sent successfully",
  });
};

module.exports = { createAppInvite };
