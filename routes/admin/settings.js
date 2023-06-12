const express = require("express");
const router = express.Router();

const {
  getSettings,
  updateSettings,
  resetDefaultSettings,
  checkOpenApiKeyValidity,
  checkRainforestApiKeyValidity,
} = require("../../controllers/admin/settings");

router.route("/").get(getSettings).patch(updateSettings);
router.route("/reset").patch(resetDefaultSettings);
router.route("/checkOpenApiKeyValidity").get(checkOpenApiKeyValidity);
router
  .route("/checkRainforestApiKeyValidity")
  .get(checkRainforestApiKeyValidity);

module.exports = router;
