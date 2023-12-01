const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const moment = require("moment");

const { createContact } = require("./contacts");
const { createEvent } = require("./events");

const {
  sendVerificationOTP,
  sendForgotPasswordEmail,
} = require("../utils/send_mail");

const usersCollection = "users";
const otpCollection = "otp";

const register = async (req, res) => {
  const { name, email, profileImage } = req.body;
  let { password } = req.body;

  _validateRegisterBody(name, email, password);

  await preventDuplication(req, email);

  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);

  const user = {
    name,
    email,
    password,
    verified: false,
    profileImage: profileImage,
    createdAt: req.admin.firestore.Timestamp.now(),
    blocked: false,
    deletedAt: null,
  };

  const userRef = await req.db.collection(usersCollection).add(user);

  delete user.password;

  await createAndSendOtp(req, userRef, user);

  res.status(StatusCodes.OK).json({
    code: "register_user",
    message: "User registered successfully. Enter OTP to verify your email",
    data: {
      id: userRef.id,
      ...user,
      // token,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  _validateLoginBody(email, password);

  const user = await req.db
    .collection(usersCollection)
    .where("email", "==", email)
    .get();

  if (user.empty) {
    throw new BadRequestError("Invalid email or password");
  }

  const userRef = user.docs[0];
  const userData = await userRef.data();

  if (!userData.verified) {
    await createAndSendOtp(req, userRef, userData);
    res.status(StatusCodes.OK).json({
      code: "unverified_email",
      message: "Email not verified. Enter OTP to verify your email",
    });
  }

  const isMatch = await matchPassword(password, userData.password);

  if (!isMatch) {
    throw new BadRequestError("Invalid email or password");
  }
  delete userData.password;
  const token = createJWT(userRef.id, userData.name, "user");

  res.status(StatusCodes.OK).json({
    code: "login_user",
    message: "User logged in successfully",
    data: {
      id: userRef.id,
      ...userData,

      token,
    },
  });
};

const editProfile = async (req, res) => {
  const { name, profileImage } = req.body;

  const user = await req.db.collection(usersCollection).doc(req.user.uid).get();

  if (!user.exists) {
    throw new NotFoundError("User not found");
  }

  const userData = await user.data();

  const updatedUser = {
    name: name || userData.name,
    profileImage: profileImage || userData.profileImage,
    updatedAt: req.admin.firestore.Timestamp.now(),
  };

  await req.db
    .collection(usersCollection)
    .doc(req.user.uid)
    .update(updatedUser);

  res.status(StatusCodes.OK).json({
    code: "edit_profile",
    message: "Profile updated successfully",
    data: {
      id: req.user.uid,
      ...updatedUser,
    },
  });
};

const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Please provide an email");
  }

  const user = await req.db
    .collection(usersCollection)
    .where("email", "==", email)
    .get();

  if (user.empty) {
    throw new BadRequestError("Invalid email");
  }

  const userRef = user.docs[0];
  const userData = await userRef.data();

  if (userData.verified) {
    throw new BadRequestError("Email already verified");
  }

  await createAndSendOtp(req, userRef, userData);

  res.status(StatusCodes.OK).json({
    code: "resend_otp",
    message: "OTP sent successfully",
  });
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    switch (true) {
      case !email:
        throw new BadRequestError("Please provide an email");
      case !otp:
        throw new BadRequestError("Please provide an OTP");
      default:
        break;
    }
  }

  const otpData = await req.db
    .collection(otpCollection)
    .where("userEmail", "==", email)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (otpData.empty) {
    throw new BadRequestError("Invalid OTP");
  }

  const otpRef = otpData.docs[0];
  const otpDataObj = await otpRef.data();

  if (otpDataObj.otpExpiry < req.admin.firestore.Timestamp.now().seconds) {
    throw new BadRequestError("OTP expired");
  }

  const isMatch = await matchPassword(otp, otpDataObj.hashedOtp);

  if (!isMatch) {
    throw new BadRequestError("Invalid OTP");
  }

  await otpRef.ref.delete();

  await req.db.collection(usersCollection).doc(otpDataObj.userId).update({
    verified: true,
  });

  const userDoc = await req.db

    .collection(usersCollection)
    .doc(otpDataObj.userId)
    .get();

  const user = await userDoc.data();

  delete user.password;

  const token = createJWT(otpDataObj.userId, user.name, "user");

  const demoContact = {
    profileImage:
      "https://firebasestorage.googleapis.com/v0/b/giftola-4b95c.appspot.com/o/giftola-favicon.png?alt=media",
    name: "John Doe",
    email: "johndoe@yopmail.com",
    phone: "+919876543210",
    dob: "2007-04-29T12:05:15.002Z",
    address: "123, Street",
    city: "City",
    state: "State",
    zipCode: "123456",
  };

  let reqData = {
    body: demoContact,
    user: {
      uid: otpDataObj.userId,
    },
    db: req.db,
    admin: req.admin,
  };

  const contact = await createContact(reqData, res, false);
  const futureDateString = getFutureDate(10);
  const demoEvent = {
    title: "John's Birthday",
    date: futureDateString,
    description: "John's Birthday",
    venue: "John's Residence",
    coverImage:
      "https://firebasestorage.googleapis.com/v0/b/giftola-4b95c.appspot.com/o/giftola-favicon.png?alt=media",
    prefferedCost: 20,
    createdFor: contact.id,
  };

  reqData = {
    body: demoEvent,
    user: {
      uid: otpDataObj.userId,
    },
    db: req.db,
    admin: req.admin,
  };

  const event = await createEvent(reqData, res, false);

  res.status(StatusCodes.OK).json({
    code: "verify_otp",

    message: "Account verified successfully",
    data: {
      id: otpDataObj.userId,
      ...user,
      token,
    },
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new BadRequestError("Please provide an email");
  }

  const user = await req.db
    .collection(usersCollection)
    .where("email", "==", email)
    .get();

  if (user.empty) {
    throw new BadRequestError("Invalid email");
  }

  const userRef = user.docs[0];
  const userData = await userRef.data();

  const salt = await bcrypt.genSalt(10);

  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
    alphabets: false,
  });
  const hashedOtp = bcrypt.hashSync(otp, salt);

  const otpExpiry =
    req.admin.firestore.Timestamp.now().seconds +
    60 * process.env.OTP_EXPIRES_IN_MINUTES;

  const otpData = {
    hashedOtp,
    otpExpiry,
    userId: userRef.id,
    userEmail: userData.email,
    createdAt: req.admin.firestore.Timestamp.now(),
  };

  await req.db.collection(otpCollection).add(otpData);

  await sendForgotPasswordEmail(req.db, userData.email, userData.name, otp);

  res.status(StatusCodes.OK).json({
    code: "forgot_password",
    message: "OTP sent successfully",
  });
};

const resetPassword = async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    switch (true) {
      case !email:
        throw new BadRequestError("Please provide an email");
      case !otp:
        throw new BadRequestError("Please provide an OTP");
      case !password:
        throw new BadRequestError("Please provide a password");
      default:
        break;
    }
  }

  const otpData = await req.db
    .collection(otpCollection)
    .where("userEmail", "==", email)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (otpData.empty) {
    throw new BadRequestError("Invalid OTP");
  }

  const otpRef = otpData.docs[0];
  const otpDataObj = await otpRef.data();

  if (otpDataObj.otpExpiry < req.admin.firestore.Timestamp.now().seconds) {
    throw new BadRequestError("OTP expired");
  }

  const isMatch = await matchPassword(otp, otpDataObj.hashedOtp);

  if (!isMatch) {
    throw new BadRequestError("Invalid OTP");
  }

  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(password, salt);

  await otpRef.ref.delete();

  await req.db.collection(usersCollection).doc(otpDataObj.userId).update({
    password: hashedPassword,
  });

  res.status(StatusCodes.OK).json({
    code: "reset_password",
    message: "Password reset successfully",
  });
};

const deleteAccount = async (req, res) => {
  //TODO: soft delete user
};

module.exports = {
  register,
  login,
  resendOtp,
  verifyOtp,
  editProfile,
  forgotPassword,
  resetPassword,
};

async function createAndSendOtp(req, userRef, user) {
  const salt = await bcrypt.genSalt(10);

  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
    alphabets: false,
  });
  const hashedOtp = bcrypt.hashSync(otp, salt);

  const otpExpiry =
    req.admin.firestore.Timestamp.now().seconds +
    60 * process.env.OTP_EXPIRES_IN_MINUTES;

  const otpData = {
    hashedOtp,
    otpExpiry,
    userId: userRef.id,
    userEmail: user.email,
    createdAt: req.admin.firestore.Timestamp.now(),
  };

  await req.db.collection(otpCollection).add(otpData);

  await sendVerificationOTP(req.db, user.email, user.name, otp);
}

function matchPassword(password, userPassword) {
  return bcrypt.compare(password, userPassword);
}

function _validateLoginBody(email, password) {
  if (!email || !password) {
    switch (true) {
      case !email:
        throw new BadRequestError("Please provide an email");
      case !password:
        throw new BadRequestError("Please provide a password");
      default:
        break;
    }
  }
}

async function preventDuplication(req, email) {
  const userExists = await req.db
    .collection(usersCollection)
    .where("email", "==", email)
    .get();

  if (!userExists.empty) {
    throw new BadRequestError("User already exists");
  }
}

function createJWT(id, name, role) {
  return jwt.sign({ id, name, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

function _validateRegisterBody(name, email, password) {
  if (!name || !email || !password) {
    switch (true) {
      case !name:
        throw new BadRequestError("Please provide a name");
      case !email:
        throw new BadRequestError("Please provide an email");
      case !password:
        throw new BadRequestError("Please provide a password");
      default:
        break;
    }
  }
}

function getFutureDate(daysFromNow) {
  const futureDate = moment().add(daysFromNow, "days");
  return futureDate.format("MMMM DD, YYYY::HH:mm A");
}
