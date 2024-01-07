const { StatusCodes } = require("http-status-codes");
const { UnauthenticatedError, BadRequestError } = require("../errors");

const contactsCollection = "contacts";
const eventsCollection = "events";

const createContact = async (req, res, respond = true) => {
  _validateCreateContactFields(req.body);

  const contact = {
    ...req.body,
    selectedCategories: [],
    preferences: [],
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };
  const contactRef = await req.db.collection(contactsCollection).add(contact);

  if (respond) {
    return res.status(StatusCodes.CREATED).json({
      code: "create_contact",
      message: "Contact created successfully",
      data: { id: contactRef.id, ...contact },
    });
  }
  return { id: contactRef.id, ...contact };
};

const getContacts = async (req, res) => {
  if (req.query.id) {
    return getContact(req, res);
  }

  const contactsRef = await req.db
    .collection(contactsCollection)
    .where("createdBy", "==", req.user.uid)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const contacts = [];
  contactsRef.forEach((contact) => {
    contacts.push({ id: contact.id, ...contact.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_contacts",
    message: "Contacts retrieved successfully",
    data: contacts,
  });
};

const getContact = async (req, res) => {
  const contactId = req.params.id || req.query.id;
  const contactRef = await req.db
    .collection(contactsCollection)
    .doc(contactId)
    .get();

  _verifyExistance(contactRef);

  const contactData = contactRef.data();

  validateContactAccess(contactData, req);

  const contact = { id: contactRef.id, ...contactData };

  res.status(StatusCodes.OK).json({
    code: "get_contact",
    message: "Contact retrieved successfully",
    data: contact,
  });
};

const updateContact = async (req, res) => {
  const contactId = req.params.id || req.query.id;

  const contactRef = await req.db
    .collection(contactsCollection)
    .doc(contactId)
    .get();

  _verifyExistance(contactRef);

  const contactData = contactRef.data();

  validateContactAccess(contactData, req);

  delete req.body.createdBy;
  delete req.body.createdAt;
  delete req.body.deletedAt;

  req.body.updatedAt = req.admin.firestore.Timestamp.now();

  await req.db.collection(contactsCollection).doc(contactId).update(req.body);

  res.status(StatusCodes.OK).json({
    code: "update_contact",
    message: "Contact updated successfully",
    data: {
      id: contactId,
    },
  });
};

const deleteContact = async (req, res) => {
  const contactId = req.params.id || req.query.id;

  const contactRef = await req.db
    .collection(contactsCollection)
    .doc(contactId)
    .get();

  _verifyExistance(contactRef);

  const contactData = contactRef.data();

  validateContactAccess(contactData, req);

  await req.db
    .collection(contactsCollection)
    .doc(contactId)
    .update({ deletedAt: req.admin.firestore.Timestamp.now() });

  await req.db
    .collection(eventsCollection)
    .where("createdFor", "==", contactId)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        doc.ref.update({ deletedAt: req.admin.firestore.Timestamp.now() });
      });
    });

  res.status(StatusCodes.OK).json({
    code: "delete_contact",
    message: "Contact deleted successfully",
    data: {
      id: contactId,
    },
  });
};

module.exports = {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
};
function _verifyExistance(contactRef) {
  if (!contactRef.exists) {
    throw new BadRequestError("Contact not found");
  }
}

function validateContactAccess(contactData, req) {
  if (contactData.createdBy !== req.user.uid) {
    throw new BadRequestError("You are not authorized to access this contact");
  } else if (contactData.deletedAt !== null) {
    throw new BadRequestError("Contact not found");
  }
}

function _validateCreateContactFields(body) {
  if (
    // body.firstName === undefined ||
    // body.lastName === undefined ||
    body.phone === undefined
  ) {
    switch (undefined) {
      // case body.firstName:
      //   throw new BadRequestError("First Name is required");
      // case body.lastName:
      //   throw new BadRequestError("Last Name is required");
      case body.phone:
        throw new BadRequestError("phone is required");
      default:
        throw new BadRequestError("All fields are required");
    }
  }
}
