const express = require("express");
const router = express.Router();

const {
  getBooksCategories,
  createBooksCategory,
  getBooks,
  createBook,
  populateBooks,
} = require("../controllers/books");

router.route("/populate").get(populateBooks);
router.route("/categories").get(getBooksCategories).post(createBooksCategory);
router.route("/").get(getBooks).post(createBook);

module.exports = router;
