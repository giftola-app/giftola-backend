const express = require("express");
const router = express.Router();

const {
  register,
  login,
  resendOtp,
  verifyOtp,
  saveGift,
  getSavedGifts,
} = require("../controllers/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verifyOtp);
router.post("/resend", resendOtp);

module.exports = router;
