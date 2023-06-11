const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const groupCollection = "groups";
const listCollection = "lists";
const productCollection = "products";

const createGroupList = async (req, res) => {
  const { name, description, image, groupId } = req.body;

  _validateCreateGroupListFields(req.body);

  await _checkIfMember(req, groupId);

  const groupList = {
    ...req.body,
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  const groupListRef = await req.db

    .collection(groupCollection)
    .doc(groupId)
    .collection(listCollection)
    .add(groupList);

  res.status(StatusCodes.CREATED).json({
    code: "create_group_list",
    message: "List created successfully",
    data: { id: groupListRef.id, ...groupList },
  });
};

const getGroupLists = async (req, res) => {
  const groupId = req.params.id || req.query.id;

  if (!groupId) {
    throw new BadRequestError("Group Id is required");
  }

  await _checkIfMember(req, groupId);

  const groupListsRef = await req.db
    .collection(groupCollection)
    .doc(groupId)
    .collection(listCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const groupLists = [];

  groupListsRef.forEach((groupList) => {
    groupLists.push({ id: groupList.id, ...groupList.data() });
  });

  await _attachProductsAlongList(groupLists, req, groupId);

  res.status(StatusCodes.OK).json({
    code: "get_group_lists",
    message: "Group Lists fetched successfully",
    data: groupLists,
  });
};

const getGroupList = async (req, res) => {
  const groupId = req.params.groupId || req.query.groupId;
  const listId = req.params.listId || req.query.listId;

  if (!groupId) {
    throw new BadRequestError("Group Id is required");
  }
  if (!listId) {
    throw new BadRequestError("List Id is required");
  }

  await _checkIfMember(req, groupId);

  const groupListRef = await req.db
    .collection(groupCollection)
    .doc(groupId)
    .collection(listCollection)
    .doc(listId)
    .get();

  if (!groupListRef.exists) {
    throw new NotFoundError("No such Group List found");
  }

  const groupList = { id: groupListRef.id, ...groupListRef.data() };

  await _attachProductsAlongList([groupList], req, groupId);

  res.status(StatusCodes.OK).json({
    code: "get_group_list",
    message: "Group List fetched successfully",
    data: { id: groupListRef.id, ...groupListRef.data() },
  });
};

const updateGroupList = async (req, res) => {
  const groupId = req.params.groupId || req.query.groupId;
  const listId = req.params.listId || req.query.listId;

  if (!groupId) {
    throw new BadRequestError("Group Id is required");
  }
  if (!listId) {
    throw new BadRequestError("List Id is required");
  }

  await _checkIfMember(req, groupId);

  const groupListRef = await req.db
    .collection(groupCollection)
    .doc(groupId)
    .collection(listCollection)
    .doc(listId)
    .get();

  if (!groupListRef.exists) {
    throw new NotFoundError("Group List not found");
  } else if (groupListRef.data().createdBy !== req.user.uid) {
    throw new BadRequestError("You are not authorized to update this list");
  }

  const { name, description, image } = req.body;

  const groupList = {
    ...req.body,
    updatedAt: req.admin.firestore.Timestamp.now(),
  };

  await groupListRef.ref.update(groupList);

  res.status(StatusCodes.OK).json({
    code: "update_group_list",
    message: "Group List updated successfully",
    data: { id: groupListRef.id, ...groupList },
  });
};

const deleteGroupList = async (req, res) => {
  const groupId = req.params.groupId || req.query.groupId;
  const listId = req.params.listId || req.query.listId;

  if (!groupId) {
    throw new BadRequestError("Group Id is required");
  }
  if (!listId) {
    throw new BadRequestError("List Id is required");
  }

  await _checkIfMember(req, groupId);
  const groupListRef = await req.db
    .collection(groupCollection)
    .doc(groupId)
    .collection(listCollection)
    .doc(listId)
    .get();

  if (!groupListRef.exists) {
    throw new NotFoundError("Group List not found");
  } else if (groupListRef.data().createdBy !== req.user.uid) {
    throw new BadRequestError("You are not authorized to delete this list");
  }

  await groupListRef.ref.update({
    deletedAt: req.admin.firestore.Timestamp.now(),
  });

  res.status(StatusCodes.OK).json({
    code: "delete_group_list",
    message: "Group List deleted successfully",
    data: { id: groupListRef.id },
  });
};

const _validateCreateGroupListFields = (body) => {
  const { name, description, image, groupId } = body;

  if (!name) {
    throw new BadRequestError("Name is required");
  }
  if (!description) {
    throw new BadRequestError("Description is required");
  }
  if (!image) {
    throw new BadRequestError("Image is required");
  }
  if (!groupId) {
    throw new BadRequestError("Group Id is required");
  }
};

module.exports = {
  createGroupList,
  getGroupLists,
  getGroupList,
  updateGroupList,
  deleteGroupList,
};
async function _checkIfMember(req, groupId) {
  const groupRef = await req.db.collection(groupCollection).doc(groupId).get();
  if (!groupRef.exists) {
    throw new NotFoundError("No such Group found");
  } else if (!groupRef.data().members.includes(req.user.uid)) {
    throw new BadRequestError("You are not a member of this group");
  }
}

async function _attachProductsAlongList(groupLists, req, groupId) {
  for (let i = 0; i < groupLists.length; i++) {
    const groupList = groupLists[i];
    const productsRef = await req.db

      .collection(groupCollection)
      .doc(groupId)
      .collection(listCollection)
      .doc(groupList.id)
      .collection(productCollection)
      .where("deletedAt", "==", null)
      .orderBy("createdAt", "desc")
      .get();

    const products = [];

    productsRef.forEach((product) => {
      products.push({ id: product.id, ...product.data() });
    });

    groupList.products = products;
  }
}
