const express = require("express");
const router = express.Router();

const {
  getBooksCategories,
  createBooksCategory,
  getBooks,
  createBook,
} = require("../controllers/books");

router.route("/categories").get(getBooksCategories).post(createBooksCategory);
router.route("/").get(getBooks).post(createBook);

module.exports = router;
