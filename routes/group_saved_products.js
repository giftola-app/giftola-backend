const express = require("express");
const router = express.Router();

const {
  getSavedGifts,
  saveGift,
} = require("../controllers/group_saved_products");

router.route("/").get(getSavedGifts).post(saveGift);

module.exports = router;