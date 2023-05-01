const express = require("express");

const router = express.Router();

const {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/questions");

router
  .route("/")
  .post(createQuestion)
  .get(getQuestions)
  .patch(updateQuestion)
  .delete(deleteQuestion);

router
  .route("/:id")
  .get(getQuestion)
  .patch(updateQuestion)
  .delete(deleteQuestion);

module.exports = router;
