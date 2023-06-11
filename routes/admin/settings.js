const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
  resetDefaultSettings,
} = require("../../controllers/admin/settings");

router.route("/").get(getSettings).patch(updateSettings);
router.route("/reset").patch(resetDefaultSettings);

module.exports = router;
