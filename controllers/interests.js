const StatusCodes = require("http-status-codes");
const { BadRequestError } = require("../errors");

const categoriesCollection = "categories";

const createCategory = async (req, res) => {
  const { name, description } = req.body;

  _validateCreateCategoryFields(req.body);

  //check if a category with the same name exists
  let categoryRef = await req.db

    .collection(categoriesCollection)
    .where("name", "==", name)
    .where("createdBy", "==", req.user.uid)
    .where("deletedAt", "==", null)
    .get();

  if (!categoryRef.empty) {
    throw new BadRequestError("Category with the same name already exists");
  }

  const category = {
    ...req.body,
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  categoryRef = await req.db.collection(categoriesCollection).add(category);

  res.status(StatusCodes.CREATED).json({
    code: "create_category",
    message: "Category created successfully",
    data: { id: categoryRef.id, ...category },
  });
};

const getCategories = async (req, res) => {
  if (req.query.id) {
    return getCategory(req, res);
  }

  const categoriesRef = await req.db
    .collection(categoriesCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const categories = [];

  categoriesRef.forEach((category) => {
    categories.push({ id: category.id, ...category.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_categories",
    message: "Categories retrieved successfully",
    data: categories,
  });
};

const getCategory = async (req, res) => {
  const categoryId = req.params.id || req.query.id;

  const categoryRef = await req.db
    .collection(categoriesCollection)
    .doc(categoryId)
    .get();

  if (!categoryRef.exists) {
    throw new BadRequestError("Category does not exist");
  }

  const categoryDoc = categoryRef.data();

  res.status(StatusCodes.OK).json({
    code: "get_category",
    message: "Category retrieved successfully",
    data: { id: categoryRef.id, ...categoryDoc },
  });
};

const updateCategory = async (req, res) => {
  const categoryId = req.params.id || req.query.id;

  const categoryRef = await req.db
    .collection(categoriesCollection)
    .doc(categoryId)
    .get();

  if (!categoryRef.exists) {
    throw new BadRequestError("Category does not exist");
  }

  const categoryDoc = categoryRef.data();

  //check if a category with the same name exists
  if (req.body.name) {
    let categoryWithSameNameRef = await req.db
      .collection(categoriesCollection)
      .where("name", "==", req.body.name)
      .where("createdBy", "==", req.user.uid)
      .where("deletedAt", "==", null)
      .get();

    if (!categoryWithSameNameRef.empty) {
      const categoryWithSameNameDoc = categoryWithSameNameRef.docs[0].data();

      if (categoryWithSameNameDoc.name === categoryDoc.name) {
        throw new BadRequestError("Category with the same name already exists");
      }
    }
  }

  _validateCategoryAccess(categoryDoc, req);

  delete req.body.createdBy;
  delete req.body.createdAt;
  delete req.body.deletedAt;

  await categoryRef.ref.update(req.body);

  res.status(StatusCodes.OK).json({
    code: "update_category",
    message: "Category updated successfully",
    data: { id: categoryRef.id },
  });
};

const deleteCategory = async (req, res) => {
  const categoryId = req.params.id || req.query.id;

  const categoryRef = await req.db
    .collection(categoriesCollection)
    .doc(categoryId)
    .get();

  if (!categoryRef.exists) {
    throw new BadRequestError("Category does not exist");
  }

  const categoryDoc = categoryRef.data();

  _validateCategoryAccess(categoryDoc, req);

  await categoryRef.ref.update({
    deletedAt: req.admin.firestore.Timestamp.now(),
  });

  res.status(StatusCodes.OK).json({
    code: "delete_category",
    message: "Category deleted successfully",
  });
};

const _validateCreateCategoryFields = (body) => {
  if (!body.name) {
    throw new BadRequestError("Name is required");
  }

  if (!body.description) {
    throw new BadRequestError("Description is required");
  }
};

const _validateCategoryAccess = (categoryDoc, req) => {
  if (categoryDoc.createdBy !== req.user.uid) {
    throw new BadRequestError("Category does not exist");
  } else if (categoryDoc.deletedAt) {
    throw new BadRequestError("Category does not exist");
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
