const express = require("express");

const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categories");

router
  .route("/")
  .post(createCategory)
  .get(getCategories)
  .patch(updateCategory)
  .delete(deleteCategory);

router
  .route("/:id")
  .get(getCategory)
  .patch(updateCategory)
  .delete(deleteCategory);

module.exports = router;
