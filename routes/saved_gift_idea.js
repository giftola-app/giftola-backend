const express = require("express");
const router = express.Router();

const {
  getSavedGiftIdeas,
  saveGiftIdea,
  updateSavedGiftIdea,
  deleteSavedGiftIdea,
} = require("../controllers/saved_gift_idea");

router
  .route("/")
  .get(getSavedGiftIdeas)
  .post(saveGiftIdea)
  .patch(updateSavedGiftIdea)
  .delete(deleteSavedGiftIdea);

module.exports = router;
