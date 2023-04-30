const StatusCodes = require("http-status-codes");
const { UnauthenticatedError } = require("../errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");

const { sendVerificationOTP } = require("../utils/send_mail");

const usersCollection = "users";
const otpCollection = "otp";

const register = async (req, res) => {
  const { name, email } = req.body;
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
    profileImage: null,
    createdAt: req.admin.firestore.Timestamp.now(),
    blocked: false,
    deletedAt: null,
  };

  const userRef = await req.db.collection(usersCollection).add(user);

  // const token = createJWT(userRef.id, name, "user");

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
    throw new UnauthenticatedError("Invalid email or password");
  }

  const userRef = user.docs[0];
  const userData = await userRef.data();

  if (!userData.verified) {
    throw new UnauthenticatedError("Please verify your email");
  }

  const isMatch = await matchPassword(password, userData.password);

  if (!isMatch) {
    throw new UnauthenticatedError("Invalid email or password");
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

const resendOtp = async (req, res) => {
  const { email } = req.body;

  const user = await req.db
    .collection(usersCollection)
    .where("email", "==", email)
    .get();

  if (user.empty) {
    throw new UnauthenticatedError("Invalid email");
  }

  const userRef = user.docs[0];
  const userData = await userRef.data();

  if (userData.verified) {
    throw new UnauthenticatedError("Email already verified");
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
        throw new UnauthenticatedError("Please provide an email");
      case !otp:
        throw new UnauthenticatedError("Please provide an OTP");
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
    throw new UnauthenticatedError("Invalid OTP");
  }

  const otpRef = otpData.docs[0];
  const otpDataObj = await otpRef.data();

  if (otpDataObj.otpExpiry < req.admin.firestore.Timestamp.now().seconds) {
    throw new UnauthenticatedError("OTP expired");
  }

  const isMatch = await matchPassword(otp, otpDataObj.hashedOtp);

  if (!isMatch) {
    throw new UnauthenticatedError("Invalid OTP");
  }

  await otpRef.ref.delete();

  await otpRef.ref.update({
    verified: true,
  });

  await req.db.collection(usersCollection).doc(otpDataObj.userId).update({
    verified: true,
  });

  res.status(StatusCodes.OK).json({
    code: "verify_otp",
    message: "Account verified successfully",
  });
};

module.exports = {
  register,
  login,
  resendOtp,
  verifyOtp,
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

  await sendVerificationOTP(user.email, user.name, otp);
}

function matchPassword(password, userPassword) {
  return bcrypt.compare(password, userPassword);
}

function _validateLoginBody(email, password) {
  if (!email || !password) {
    switch (true) {
      case !email:
        throw new UnauthenticatedError("Please provide an email");
      case !password:
        throw new UnauthenticatedError("Please provide a password");
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
    throw new UnauthenticatedError("User already exists");
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
        throw new UnauthenticatedError("Please provide a name");
      case !email:
        throw new UnauthenticatedError("Please provide an email");
      case !password:
        throw new UnauthenticatedError("Please provide a password");
      default:
        break;
    }
  }
}
