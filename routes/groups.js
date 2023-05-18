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

const {
  createGroupProduct,
  getGroupProducts,
  getGroupProduct,
  updateGroupProduct,
  deleteGroupProduct,
} = require("../controllers/group_products");

router
  .route("/products")
  .post(createGroupProduct)
  .get(getGroupProducts)
  .delete(deleteGroupProduct)
  .patch(updateGroupProduct);

router.route("/accept-invite").get(acceptInvite);

router.route("/members").get(getAllGroupMembers);
router
  .route("/")
  .post(createGroup)
  .get(getGroups)
  .patch(updateGroup)
  .delete(deleteGroup);

router.route("/:id").get(getGroup).patch(updateGroup).delete(deleteGroup);

router.route("/invite").post(inviteMember);

module.exports = router;
