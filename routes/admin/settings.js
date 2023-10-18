const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
  resetDefaultSettings,
  checkOpenApiKeyValidity,
  checkRainforestApiKeyValidity,
  testBrevoApiKeys,
} = require("../../controllers/admin/settings");

router.route("/reset").patch(resetDefaultSettings);
router.route("/checkOpenApiKeyValidity").get(checkOpenApiKeyValidity);
router
  .route("/checkRainforestApiKeyValidity")
  .get(checkRainforestApiKeyValidity);
router.route("/testBrevoApiKeys").get(testBrevoApiKeys);
router.route("/").get(getSettings).patch(updateSettings);

module.exports = router;
