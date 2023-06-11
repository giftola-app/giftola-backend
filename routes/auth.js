const express = require("express");
const router = express.Router();

const {
  register,
  login,
  resendOtp,
  verifyOtp,
  editProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyOtp);
router.post("/resend", resendOtp);
router.post("/edit", editProfile);

router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);

module.exports = router;
