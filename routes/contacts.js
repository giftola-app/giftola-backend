const express = require("express");
const router = express.Router();

const {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
} = require("../controllers/contacts");

//if req has query param by name id then it will go to getContact
//else it will go to getContacts

router
  .route("/")
  .post(createContact)
  .get(getContacts)
  .patch(updateContact)
  .delete(deleteContact);
router.route("/:id").get(getContact).patch(updateContact).delete(deleteContact);

module.exports = router;
