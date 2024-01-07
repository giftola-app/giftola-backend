const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");

const booksCategoriesCollection = "bookCategories";
const booksCollection = "books";
const settingsCollection = "settings";
const settingsDoc = "giftola-settings";

const getBooksCategories = async (req, res, respond = true) => {
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
  if (respond) {
    res.status(StatusCodes.OK).json({
      code: "get_books_categories",
      message: "Books categories retrieved successfully",
      data: results,
    });
  }
  return results;
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

const populateBooks = async (req, res, db, admin) => {
  if (!req) {
    req = {
      db,
      admin,
    };
  }
  console.log("populating books");
  const bookCategories = await getBooksCategories(req, res, false);

  const settingsRef = await req.db
    .collection(settingsCollection)
    .doc(settingsDoc)
    .get();

  if (!settingsRef.exists) {
    throw new BadRequestError("Settings does not exist");
  }

  const settingsData = settingsRef.data();

  const rainforestApiKey = settingsData.RAINFOREST_KEY;

  try {
    for (let i = 0; i < bookCategories.length; i++) {
      const category = bookCategories[i];

      const books = await _getBooksFromRainforest(
        category.url,
        rainforestApiKey,
        category.id,
        req
      );
      console.log("books length", books.length);
      if (books.length === 0) {
        console.log("no books found");
        continue;
      }

      await _populateBooks(books, db);
    }
  } catch (error) {
    console.log("error", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      code: "populate_books",
      message: "Error populating books",
      data: {},
    });
  }

  res.status(StatusCodes.OK).json({
    code: "populate_books",
    message: "Books populated successfully",
    data: {},
  });
};

const _getBooksFromRainforest = async (url, apiKey, categoryId, req) => {
  const rainforestUrl = `https://api.rainforestapi.com/request?api_key=${apiKey}&type=bestsellers&url=${url}`;

  const response = await fetch(rainforestUrl);
  const data = await response.json();

  let bestSellers = data.bestsellers;

  bestSellers = bestSellers.slice(0, 10);

  const books = _parseRainforestResponse(bestSellers, categoryId, req);

  return books;
};

const _parseRainforestResponse = (bestSellers, categoryId, req) => {
  const books = [];

  const now = req.admin.firestore.Timestamp.now();

  for (let i = 0; i < bestSellers.length; i++) {
    const bestSeller = bestSellers[i];

    const book = {
      srNumber: bestSeller.rank ?? 0,
      name: bestSeller.title ?? "",
      ratingValue: bestSeller.rating?.value ?? 0,
      ratingCount: bestSeller.ratings_total ?? 0,

      author: bestSeller.sub_title?.text ?? bestSeller.variant,

      url: bestSeller.link ?? "",
      imageUrl: bestSeller.image ?? "",
      price: bestSeller.price?.raw ?? 0,
      type: "book",
      categoryId: categoryId,
      createdAt: now,
      deletedAt: null,
    };

    books.push(book);
  }

  return books;
};

const _populateBooks = async (books, db) => {
  const batch = db.batch();

  books.forEach((book) => {
    const newBookRef = db.collection(booksCollection).doc();
    batch.set(newBookRef, {
      ...book,
    });
  });

  await batch.commit();
};

const lastDataRefreshDate = async (req, res) => {
  const books = await req.db
    .collection(booksCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  const data = [];
  books.forEach((doc) => {
    data.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  const date = data[0]?.createdAt?.toDate();

  res.status(StatusCodes.OK).json({
    code: "last_updated_books",
    message: "Last updated books retrieved successfully",
    data: date,
  });
};

module.exports = {
  getBooksCategories,
  createBooksCategory,
  getBooks,
  createBook,
  populateBooks,
  lastDataRefreshDate,
};
