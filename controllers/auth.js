const StatusCodes = require("http-status-codes");
const { UnauthenticatedError } = require("../errors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { sendEmailVerificationLink } = require("../utils/send_mail");

const usersCollection = "users";

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

  const token = createJWT(userRef.id, name, "user");

  delete user.password;

  res.status(StatusCodes.OK).json({
    code: "register_user",
    message: "User registered successfully",
    data: {
      user: userRef.id,
      ...user,
      token,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  _validateLoginBody(email, password);

  //find user with email
  const user = await req.db
    .collection(usersCollection)
    .where("email", "==", email)
    .get();

  if (user.empty) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  const userRef = user.docs[0];
  const userData = await userRef.data();

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

module.exports = {
  register,
  login,
};

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
