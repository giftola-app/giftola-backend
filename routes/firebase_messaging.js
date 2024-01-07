const express = require("express");
const router = express.Router();

const {
  notifyEveryone,
  notifyUser,
} = require("../controllers/firebase_messaging");

router.post("/", notifyEveryone);
router.post("/user", notifyUser);

module.exports = router;
