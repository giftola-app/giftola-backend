const StatusCodes = require("http-status-codes");
const { BadRequestError } = require("../errors");

const groupsCollection = "groups";
const usersCollection = "users";

const { sendGroupInvite } = require("../utils/send_mail");

const createGroup = async (req, res) => {
  const { name, image } = req.body;

  _validateCreateGroupFields(req.body);

  const group = {
    ...req.body,
    members: [req.user.uid],
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  const groupRef = await req.db.collection(groupsCollection).add(group);

  res.status(StatusCodes.CREATED).json({
    code: "create_group",
    message: "Group created successfully",
    data: { id: groupRef.id, ...group },
  });
};

const getGroups = async (req, res) => {
  if (req.query.id) {
    return getGroup(req, res);
  }

  const groupsRef = await req.db
    .collection(groupsCollection)
    .where("deletedAt", "==", null)
    .where("members", "array-contains", req.user.uid)
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
    throw new BadRequestError("Group doesn't exist");
  }

  res.status(StatusCodes.OK).json({
    code: "get_group",
    message: "Group retrieved successfully",
    data: { id: groupRef.id, ...groupRef.data() },
  });
};

const updateGroup = async (req, res) => {
  const groupId = req.params.id || req.query.id;

  const groupRef = await req.db.collection(groupsCollection).doc(groupId).get();

  if (!groupRef.exists) {
    throw new BadRequestError("Group doesn't exist");
  }

  const group = groupRef.data();

  _validateGroupAccess(group, req);

  delete req.body.members;
  delete req.body.createdAt;
  delete req.body.createdBy;
  delete req.body.deletedAt;

  //   _validateUpdateGroupFields(req.body, group);

  const updatedGroup = {
    ...group,
    ...req.body,
    updatedAt: req.admin.firestore.Timestamp.now(),
  };

  await groupRef.ref.update(updatedGroup);

  res.status(StatusCodes.OK).json({
    code: "update_group",
    message: "Group updated successfully",
    data: { id: groupRef.id, ...updatedGroup },
  });
};

const deleteGroup = async (req, res) => {
  const groupId = req.params.id || req.query.id;

  const groupRef = await req.db.collection(groupsCollection).doc(groupId).get();

  if (!groupRef.exists) {
    throw new BadRequestError("Group doesn't exist");
  }

  const group = groupRef.data();

  _validateGroupAccess(group, req);

  const updatedGroup = {
    ...group,
    deletedAt: req.admin.firestore.Timestamp.now(),
  };

  await groupRef.ref.update(updatedGroup);

  res.status(StatusCodes.OK).json({
    code: "delete_group",
    message: "Group deleted successfully",
    data: { id: groupRef.id, ...updatedGroup },
  });
};

const inviteMember = async (req, res) => {
  const { email } = req.body;
  const groupId = req.params.id || req.query.id;

  _validateInviteMemberFields(email, groupId);

  const groupRef = await req.db.collection(groupsCollection).doc(groupId).get();

  if (!groupRef.exists) {
    throw new BadRequestError("Group doesn't exist");
  }

  const group = groupRef.data();

  _validateGroupAccess(group, req);

  const userRef = await req.db
    .collection(usersCollection)
    .where("email", "==", email)
    .get();

  if (userRef.empty) {
    throw new BadRequestError("User doesn't exist");
  }

  const user = userRef.docs[0].data();
  const userId = userRef.docs[0].id;

  if (group.members.includes(userId)) {
    throw new BadRequestError("User is already a member of the group");
  }

  let currentUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  currentUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));

  const acceptInviteUrl = `${currentUrl}/accept-invite?groupId=${groupId}&userId=${userId}`;

  await sendGroupInvite(user.email, user.name, group.name, acceptInviteUrl);

  res.status(StatusCodes.OK).json({
    code: "invite_member",
    message: "Member invited successfully",
    data: {},
  });
};

const acceptInvite = async (req, res) => {
  const { groupId, userId } = req.query;

  console.log(req.query);

  console.log(`groupId : ${groupId} , userId : ${userId}`);

  const groupRef = await req.db.collection(groupsCollection).doc(groupId).get();

  if (!groupRef.exists) {
    // throw new BadRequestError("Group doesn't exist");
    return res.send("Group doesn't exist");
  }

  const group = groupRef.data();

  //   const userRef = await req.db.collection(usersCollection).doc(userId).get();

  //   if (!userRef.exists) {
  //     // throw new BadRequestError("User doesn't exist");
  //    return res.send("User doesn't exist");
  //   }

  //   const user = userRef.data();

  if (group.members.includes(userId)) {
    // throw new BadRequestError("User is already a member of the group");
    return res.send("User is already a member of the group");
  }

  const updatedGroup = {
    ...group,
    members: [...group.members, userId],
    updatedAt: req.admin.firestore.Timestamp.now(),
  };

  await groupRef.ref.update(updatedGroup);

  //   res.status(StatusCodes.OK).json({
  //     code: "accept_invite",
  //     message: "Invite accepted successfully",
  //     data: { id: groupRef.id, ...updatedGroup },
  //   });
  return res.send("Invite accepted successfully");
};

const getAllGroupMembers = async (req, res) => {
  const groupId = req.params.id || req.query.id;

  console.log(`groupId : ${groupId}`);

  if (!groupId) {
    throw new BadRequestError("Group id is required");
  }

  const groupRef = await req.db.collection(groupsCollection).doc(groupId).get();

  if (!groupRef.exists) {
    throw new BadRequestError("Group doesn't exist");
  }

  const group = groupRef.data();

  const members = [];

  for (let i = 0; i < group.members.length; i++) {
    const memberRef = await req.db
      .collection(usersCollection)
      .doc(group.members[i])
      .get();
    let member = memberRef.data();

    delete member.password;
    delete member.blocked;
    delete member.createdAt;
    delete member.updatedAt;
    delete member.deletedAt;
    delete member.verified;
    members.push({ id: memberRef.id, ...member });
  }

  res.status(StatusCodes.OK).json({
    code: "get_group_members",
    message: "Group members retrieved successfully",
    data: members,
  });
};

const _validateCreateGroupFields = ({ name, image }) => {
  switch (true) {
    case !name:
      throw new BadRequestError("Name is required");
    case !image:
      throw new BadRequestError("Image is required");
    default:
      return;
  }
};

const _validateUpdateGroupFields = (body, group) => {
  if (body.name && body.name !== group.name) {
    throw new BadRequestError("Name cannot be updated");
  }
};

const _validateGroupAccess = (group, req) => {
  if (group.createdBy !== req.user.uid) {
    throw new BadRequestError("You are not authorized to perform this action");
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  inviteMember,
  acceptInvite,
  getAllGroupMembers,
};
function _validateInviteMemberFields(email, groupId) {
  switch (true) {
    case !email:
      throw new BadRequestError("Email is required");
    case !groupId:
      throw new BadRequestError("Group id is required");
    default:
      break;
  }
}
