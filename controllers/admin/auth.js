const StatusCodes = require("http-status-codes");
const { BadRequestError } = require("../../errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminCollection = "admins";

const register = async (req, res) => {
  const { name, email, profileImage } = req.body;
  let { password } = req.body;

  _validateRegisterBody(name, email, password, profileImage);

  await preventDuplication(req, email);

  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);

  const admin = {
    name,
    email,
    password,
    verified: true,
    profileImage,
    createdAt: req.admin.firestore.Timestamp.now(),
    blocked: false,
    deletedAt: null,
  };

  const adminRef = await req.db.collection(adminCollection).add(admin);

  const token = createJWT(adminRef.id, name, "admin");

  delete admin.password;

  res.status(StatusCodes.OK).json({
    code: "register_admin",
    message: "Admin registered successfully",
    data: {
      id: adminRef.id,
      ...admin,
      token,
      // token,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  _validateLoginBody(email, password);

  const admin = await req.db
    .collection(adminCollection)
    .where("email", "==", email)
    .get();

  if (admin.empty) {
    throw new BadRequestError("Invalid email or password");
  }

  const adminRef = admin.docs[0];
  const adminData = await adminRef.data();

  if (!adminData.verified) {
    await createAndSendOtp(req, adminRef, adminData);
    res.status(StatusCodes.OK).json({
      code: "unverified_email",
      message: "Email not verified. Enter OTP to verify your email",
    });
  }

  const isMatch = await matchPassword(password, adminData.password);

  if (!isMatch) {
    throw new BadRequestError("Invalid email or password");
  }
  delete adminData.password;
  const token = createJWT(adminRef.id, adminData.name, "admin");

  res.status(StatusCodes.OK).json({
    code: "login_admin",
    message: "Admin logged in successfully",
    data: {
      id: adminRef.id,
      ...adminData,
      token,
    },
  });
};

module.exports = { register, login };

function createJWT(id, name, role) {
  return jwt.sign({ id, name, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

async function preventDuplication(req, email) {
  const adminExists = await req.db
    .collection(adminCollection)
    .where("email", "==", email)
    .get();

  if (!adminExists.empty) {
    throw new BadRequestError("Admin already exists");
  }
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

function _validateRegisterBody(name, email, password, profileImage) {
  if (!name || !email || !password || !profileImage) {
    switch (true) {
      case !name:
        throw new BadRequestError("Please provide a name");
      case !email:
        throw new BadRequestError("Please provide an email");
      case !password:
        throw new BadRequestError("Please provide a password");
      case !profileImage:
        throw new BadRequestError("Please provide a profile image");
      default:
        break;
    }
  }
}

function matchPassword(password, userPassword) {
  return bcrypt.compare(password, userPassword);
}
