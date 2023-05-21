const StatusCodes = require("http-status-codes");

const { BadRequestError, NotFoundError } = require("../../errors");

const groupsCollection = "groups";

const getGroups = async (req, res) => {
  if (req.query.id) {
    return getGroup(req, res);
  }

  const groupsRef = await req.db
    .collection(groupsCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const groups = [];

  groupsRef.forEach((group) => {
    groups.push({ id: group.id, ...group.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_groups",
    message: "Groups retrieved successfully",
    data: groups,
  });
};

const getGroup = async (req, res) => {
  const groupId = req.params.id || req.query.id;

  const groupRef = await req.db.collection(groupsCollection).doc(groupId).get();

  if (!groupRef.exists) {
    throw new BadRequestError("Group does not exist");
  }

  const group = { id: groupRef.id, ...groupRef.data() };

  res.status(StatusCodes.OK).json({
    code: "get_group",
    message: "Group retrieved successfully",
    data: group,
  });
};

module.exports = { getGroups, getGroup };
