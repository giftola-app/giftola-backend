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

  //get all group member profiles
  for (let i = 0; i < groups.length; i++) {
    const members = [];

    for (let j = 0; j < groups[i].members.length; j++) {
      const memberRef = await req.db
        .collection(usersCollection)
        .doc(groups[i].members[j])
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

    groups[i].members = members;
  }

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

const successTemplate = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        text-align: center;
        background-color: #f4f4f4;
      }
    </style>
  </head>
  <body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <img src="https://firebasestorage.googleapis.com/v0/b/giftola-4b95c.appspot.com/o/giftola-favicon.png?alt=media&token=3188bc94-30eb-4551-84b9-f1d4dbe7f7f4" alt="Giftola Logo" style="max-width: 100px;">
      <h1 style="font-size: 28px; color: #333333; margin-top: 20px;">Welcome to the Group!</h1>
      <p style="font-size: 24px; color: #333333; margin-top: 20px;">You have successfully joined the group.</p>
    </div>
  </body>
  </html>
  `;

const notFoundTemplate = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        text-align: center;
        background-color: #f4f4f4;
      }
    </style>
  </head>
  <body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <img src="https://firebasestorage.googleapis.com/v0/b/giftola-4b95c.appspot.com/o/giftola-favicon.png?alt=media&token=3188bc94-30eb-4551-84b9-f1d4dbe7f7f4" alt="Giftola Logo" style="max-width: 100px;">
      <h1 style="font-size: 28px; color: #333333; margin-top: 20px;">Group Does Not Exist</h1>
      <p style="font-size: 24px; color: #333333; margin-top: 20px;">The group you are trying to access does not exist.</p>
    </div>
  </body>
  </html>
  `;

const alreadyMemberTemplate = `<!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
        text-align: center;
        background-color: #f4f4f4;
      }
    </style>
  </head>
  <body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <img src="https://firebasestorage.googleapis.com/v0/b/giftola-4b95c.appspot.com/o/giftola-favicon.png?alt=media&token=3188bc94-30eb-4551-84b9-f1d4dbe7f7f4" alt="Giftola Logo" style="max-width: 100px;">
      <h1 style="font-size: 28px; color: #333333; margin-top: 20px;">User is Already a Member</h1>
      <p style="font-size: 24px; color: #333333; margin-top: 20px;">The user is already a member of the group.</p>
    </div>
  </body>
  </html>
  `;

const acceptInvite = async (req, res) => {
  const { groupId, userId } = req.query;

  console.log(req.query);

  console.log(`groupId : ${groupId} , userId : ${userId}`);

  const groupRef = await req.db.collection(groupsCollection).doc(groupId).get();

  if (!groupRef.exists) {
    return res.send(notFoundTemplate);
  }

  const group = groupRef.data();

  if (group.members.includes(userId)) {
    return res.send(alreadyMemberTemplate);
  }

  const updatedGroup = {
    ...group,
    members: [...group.members, userId],
    updatedAt: req.admin.firestore.Timestamp.now(),
  };

  await groupRef.ref.update(updatedGroup);

  return res.send(successTemplate);
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
