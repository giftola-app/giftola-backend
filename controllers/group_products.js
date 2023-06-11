const StatusCodes = require("http-status-codes");
const { BadRequestError } = require("../errors");

const groupCollection = "groups";
const listCollection = "lists";
const productCollection = "products";

const createGroupProduct = async (req, res) => {
  const {
    name,
    url,
    price,
    description,
    image,
    groupId,
    listId,
    quantity,
    reservedBy,
  } = req.body;

  _validateCreateGroupProductFields(req.body);

  const groupProduct = {
    ...req.body,
    reservedBy: null,
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  const groupProductRef = await req.db
    .collection(groupCollection)
    .doc(groupId)
    .collection(listCollection)
    .doc(listId)
    .collection(productCollection)
    .add(groupProduct);

  res.status(StatusCodes.CREATED).json({
    code: "create_group_product",
    message: "Group Product created successfully",
    data: { id: groupProductRef.id, ...groupProduct },
  });
};

const getGroupProducts = async (req, res) => {
  const groupId = req.params.groupId || req.query.groupId;
  const listId = req.params.listId || req.query.listId;

  if (!groupId) {
    throw new BadRequestError("Group Id is required");
  }

  if (!listId) {
    throw new BadRequestError("List Id is required");
  }

  const groupProductsRef = await req.db

    .collection(groupCollection)
    .doc(groupId)
    .collection(listCollection)
    .doc(listId)
    .collection(productCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const groupProducts = [];

  groupProductsRef.forEach((groupProduct) => {
    groupProducts.push({ id: groupProduct.id, ...groupProduct.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_group_products",
    message: "Group Products fetched successfully",
    data: groupProducts,
  });
};

const getGroupProduct = async (req, res) => {
  const groupId = req.params.groupId || req.query.groupId;
  const groupProductId = req.params.productId || req.query.productId;

  const groupProductRef = await req.db
    .collection(groupCollection)
    .doc(groupId)
    .collection("products")
    .doc(groupProductId)
    .get();

  _verifyExistance(groupProductRef);

  const groupProductData = groupProductRef.data();

  const groupProduct = { id: groupProductRef.id, ...groupProductData };

  res.status(StatusCodes.OK).json({
    code: "get_group_product",
    message: "Group Product retrieved successfully",
    data: groupProduct,
  });
};

const updateGroupProduct = async (req, res) => {
  const groupId = req.params.groupId || req.query.groupId;
  const groupProductId = req.params.productId || req.query.productId;

  const groupProductRef = await req.db
    .collection(groupCollection)
    .doc(groupId)
    .collection("products")
    .doc(groupProductId)
    .get();

  _verifyExistance(groupProductRef);

  const groupProductData = groupProductRef.data();

  const { name, url, price, description, image, quantity, reservedBy } =
    req.body;

  if (groupProductData.reservedBy && reservedBy) {
    throw new BadRequestError("Product is already reserved");
  }

  const groupProduct = {
    ...req.body,
    updatedAt: req.admin.firestore.Timestamp.now(),
  };

  await groupProductRef.ref.update(groupProduct);

  res.status(StatusCodes.OK).json({
    code: "update_group_product",
    message: "Group Product updated successfully",
    data: { id: groupProductRef.id, ...groupProduct },
  });
};

const deleteGroupProduct = async (req, res) => {
  const groupId = req.params.groupId || req.query.groupId;
  const groupProductId = req.params.productId || req.query.productId;

  switch (true) {
    case !groupId:
      throw new BadRequestError("Group Id is required");
    case !groupProductId:
      throw new BadRequestError("Group Product Id is required");
    default:
      break;
  }

  const groupProductRef = await req.db
    .collection(groupCollection)
    .doc(groupId)
    .collection("products")
    .doc(groupProductId)
    .get();

  _verifyExistance(groupProductRef);

  const groupProductData = groupProductRef.data();

  const groupProduct = {
    ...groupProductData,
    deletedAt: req.admin.firestore.Timestamp.now(),
  };

  await groupProductRef.ref.update(groupProduct);

  res.status(StatusCodes.OK).json({
    code: "delete_group_product",
    message: "Group Product deleted successfully",
    data: { id: groupProductRef.id, ...groupProduct },
  });
};

const _validateCreateGroupProductFields = ({
  name,
  url,
  price,
  description,
  image,
  groupId,
  listId,
  quantity,
}) => {
  switch (true) {
    case !name:
      throw new BadRequestError("Name is required");
    case !url:
      throw new BadRequestError("Url is required");
    case !price:
      throw new BadRequestError("Price is required");
    case !description:
      throw new BadRequestError("Description is required");
    case !image:
      throw new BadRequestError("Image is required");
    case !groupId:
      throw new BadRequestError("Group Id is required");
    case !listId:
      throw new BadRequestError("List Id is required");
    case !quantity:
      throw new BadRequestError("Quantity is required");
    default:
      return;
  }
};

const _verifyExistance = (ref) => {
  if (!ref.exists) {
    throw new BadRequestError("Group Product doesn't exist");
  }
};

module.exports = {
  createGroupProduct,
  getGroupProducts,
  getGroupProduct,
  updateGroupProduct,
  deleteGroupProduct,
};
