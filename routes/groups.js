const express = require("express");
const router = express.Router();

const {
  createGroup,
  getGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  inviteMember,
  acceptInvite,
  getAllGroupMembers,
} = require("../controllers/groups");

router.route("/members").get(getAllGroupMembers);
router
  .route("/")
  .post(createGroup)
  .get(getGroups)
  .patch(updateGroup)
  .delete(deleteGroup);

router.route("/:id").get(getGroup).patch(updateGroup).delete(deleteGroup);

router.route("/invite").post(inviteMember);

router.route("/:id/accept-invite").get(acceptInvite);

module.exports = router;
