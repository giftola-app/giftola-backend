const StatusCodes = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../../errors");

const usersCollection = "users";

const getUsers = async (req, res) => {
  if (req.query.id) {
    return getUser(req, res);
  }

  const usersRef = await req.db
    .collection(usersCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const users = [];

  usersRef.forEach((user) => {
    const userDoc = user.data();
    delete userDoc.password;
    users.push({ id: user.id, ...userDoc });
  });

  res.status(StatusCodes.OK).json({
    code: "get_users",
    message: "Users retrieved successfully",
    data: users,
  });
};

const getUser = async (req, res) => {
  const userId = req.params.id || req.query.id;

  const userRef = await req.db.collection(usersCollection).doc(userId).get();

  if (!userRef.exists) {
    throw new NotFoundError("User not found");
  }

  const user = userRef.data();

  delete user.password;

  res.status(StatusCodes.OK).json({
    code: "get_user",
    message: "User retrieved successfully",
    data: { id: userRef.id, ...user },
  });
};

const updateUser = async (req, res) => {
  const userId = req.params.id || req.query.id;

  const userRef = await req.db.collection(usersCollection).doc(userId).get();

  if (!userRef.exists) {
    throw new NotFoundError("User not found");
  }

  delete req.body.id;
  delete req.body.createdAt;
  delete req.body.createdBy;
  delete req.body.updatedAt;
  delete req.body.updatedBy;
  delete req.body.deletedAt;

  const user = {
    ...req.body,
  };

  await userRef.ref.update(user);

  res.status(StatusCodes.OK).json({
    code: "update_user",
    message: "User updated successfully",
    data: { id: userRef.id },
  });
};

const deleteUser = async (req, res) => {
  const userId = req.params.id || req.query.id;

  const userRef = await req.db.collection(usersCollection).doc(userId).get();

  if (!userRef.exists) {
    throw new NotFoundError("User not found");
  }

  await userRef.ref.update({
    deletedAt: req.admin.firestore.Timestamp.now(),
  });

  res.status(StatusCodes.OK).json({
    code: "delete_user",
    message: "User deleted successfully",
    data: { id: userRef.id },
  });
};

module.exports = { getUsers, getUser, updateUser, deleteUser };
