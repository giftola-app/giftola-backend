const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
} = require("../../controllers/admin/settings");

router.route("/").get(getSettings).patch(updateSettings);

module.exports = router;
