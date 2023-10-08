const express = require("express");
const router = express.Router();

const {
  getNotifications,
  createNotification,
  readAllNotifications,
} = require("../controllers/notifications");

router.route("/read-all").post(readAllNotifications);
router.route("/").get(getNotifications).post(createNotification);

module.exports = router;
