const StatusCodes = require("http-status-codes");

const { BadRequestError } = require("../errors");

const categoriesCollection = "productCategories";

const createCategory = async (req, res) => {
  const { name, description, image } = req.body;

  _validateCreateCategoryFields(req.body);

  let categoryRef = await req.db
    .collection(categoriesCollection)
    .where("name", "==", name)
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

  const category = { id: categoryRef.id, ...categoryRef.data() };

  res.status(StatusCodes.OK).json({
    code: "get_category",
    message: "Category retrieved successfully",
    data: category,
  });
};

const updateCategory = async (req, res) => {
  const categoryId = req.params.id || req.query.id;

  const { name, description, image } = req.body;

  _validateUpdateCategoryFields(req.body);

  const categoryRef = await req.db
    .collection(categoriesCollection)
    .doc(categoryId)
    .get();

  if (!categoryRef.exists) {
    throw new BadRequestError("Category does not exist");
  }

  const categoryData = categoryRef.data();

  if (name) {
    const categoryWithSameNameRef = await req.db

      .collection(categoriesCollection)
      .where("name", "==", name)
      .where("deletedAt", "==", null)
      .get();

    if (!categoryWithSameNameRef.empty) {
      throw new BadRequestError("Category with the same name already exists");
    }
  }

  delete categoryData.id;
  delete categoryData.createdAt;
  delete categoryData.createdBy;
  delete categoryData.updatedAt;
  delete categoryData.updatedBy;
  delete categoryData.deletedAt;

  const category = {
    ...req.body,
    updatedBy: req.user.uid,
    updatedAt: req.admin.firestore.Timestamp.now(),
  };

  await req.db
    .collection(categoriesCollection)
    .doc(categoryId)
    .update(category);

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

  await req.db.collection(categoriesCollection).doc(categoryId).update({
    deletedAt: req.admin.firestore.Timestamp.now(),
    deletedBy: req.user.uid,
  });

  res.status(StatusCodes.OK).json({
    code: "delete_category",
    message: "Category deleted successfully",
    data: { id: categoryRef.id },
  });
};

const _validateCreateCategoryFields = (body) => {
  const { name, description, image } = body;

  if (!name) {
    throw new BadRequestError("Name is required");
  }

  if (!description) {
    throw new BadRequestError("Description is required");
  }

  if (!image) {
    throw new BadRequestError("Image is required");
  }
};

const _validateUpdateCategoryFields = (body) => {
  const { name, description, image } = body;

  switch (true) {
    case !name:
      throw new BadRequestError("Name is required");

    case !description:
      throw new BadRequestError("Description is required");

    case !image:
      throw new BadRequestError("Image is required");

    default:
      break;
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
