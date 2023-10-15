const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");

const booksCategoriesCollection = "bookCategories";
const booksCollection = "books";

const getBooksCategories = async (req, res) => {
  const booksCategories = await req.db
    .collection(booksCategoriesCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();
  const results = [];
  booksCategories.forEach((doc) => {
    results.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  res.status(StatusCodes.OK).json({
    code: "get_books_categories",
    message: "Books categories retrieved successfully",
    data: results,
  });
};

const createBooksCategory = async (req, res) => {
  const { name, url } = req.body;
  if (!name || !url) {
    throw new BadRequestError("Please provide all required fields");
  }
  const booksCategory = await req.db.collection(booksCategoriesCollection).add({
    ...req.body,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  });
  res.status(StatusCodes.CREATED).json({
    code: "create_books_category",
    message: "Books category created successfully",
    data: { id: booksCategory.id, ...req.body },
  });
};

const getBooks = async (req, res) => {
  const books = await req.db
    .collection(booksCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();
  const results = [];
  books.forEach((doc) => {
    results.push({
      id: doc.id,
      ...doc.data(),
    });
  });
  res.status(StatusCodes.OK).json({
    code: "get_books",
    message: "Books retrieved successfully",
    data: results,
  });
};

const createBook = async (req, res) => {
  _validateBook(req.body);
  const book = await req.db.collection(booksCollection).add({
    ...req.body,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  });
  res.status(StatusCodes.CREATED).json({
    code: "create_book",
    message: "Book created successfully",
    data: { id: book.id, ...req.body },
  });
};

const _validateBook = (book) => {
  const {
    srNumber,
    name,
    ratingValue,
    ratingCount,
    author,
    url,
    imageUrl,
    price,
    type,
    categoryId,
  } = book;
  switch (true) {
    case !srNumber:
      throw new BadRequestError("Please provide srNumber");
    case !name:
      throw new BadRequestError("Please provide name");
    case !ratingValue:
      throw new BadRequestError("Please provide ratingValue");
    case !ratingCount:
      throw new BadRequestError("Please provide ratingCount");
    case !author:
      throw new BadRequestError("Please provide author");
    case !url:
      throw new BadRequestError("Please provide url");
    case !imageUrl:
      throw new BadRequestError("Please provide imageUrl");
    case !price:
      throw new BadRequestError("Please provide price");
    case !type:
      throw new BadRequestError("Please provide type");
    case !categoryId:
      throw new BadRequestError("Please provide categoryId");
  }
};

module.exports = {
  getBooksCategories,
  createBooksCategory,
  getBooks,
  createBook,
};
