const StatusCodes = require("http-status-codes");
const { UnauthenticatedError, BadRequestError } = require("../errors");

const contactsCollection = "contacts";

const createContact = async (req, res) => {
  const {
    profileImage,
    name,
    email,
    phone,
    dob,
    address,
    city,
    state,
    zipCode,
  } = req.body;
  _validateCreateContactFields(req.body);

  const contact = {
    ...req.body,
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };
  const contactRef = await req.db.collection(contactsCollection).add(contact);

  res.status(StatusCodes.CREATED).json({
    code: "create_contact",
    message: "Contact created successfully",
    data: { id: contactRef.id, ...contact },
  });
};

const getContacts = async (req, res) => {
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
  const contactRef = await req.db
    .collection(contactsCollection)
    .doc(req.params.id)

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
  const contactRef = await req.db
    .collection(contactsCollection)
    .doc(req.params.id)
    .get();

  _verifyExistance(contactRef);

  const contactData = contactRef.data();

  validateContactAccess(contactData, req);

  delete req.body.createdBy;
  delete req.body.createdAt;
  delete req.body.deletedAt;

  const updatedContact = await req.db
    .collection(contactsCollection)
    .doc(req.params.id)
    .update(req.body);

  res.status(StatusCodes.OK).json({
    code: "get_contact",
    message: "Contact retrieved successfully",
    data: {
      id: req.params.id,
    },
  });
};

const deleteContact = async (req, res) => {
  const contactRef = await req.db
    .collection(contactsCollection)
    .doc(req.params.id)
    .get();

  _verifyExistance(contactRef);

  const contactData = contactRef.data();

  validateContactAccess(contactData, req);

  const deletedContact = await req.db
    .collection(contactsCollection)
    .doc(req.params.id)
    .update({ deletedAt: req.admin.firestore.Timestamp.now() });

  res.status(StatusCodes.OK).json({
    code: "delete_contact",
    message: "Contact deleted successfully",
    data: {
      id: req.params.id,
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
    throw new UnauthenticatedError(
      "You are not authorized to access this contact"
    );
  } else if (contactData.deletedAt !== null) {
    throw new BadRequestError("Contact not found");
  }
}

function _validateCreateContactFields(body) {
  if (
    body.profileImage === undefined ||
    body.name === undefined ||
    body.email === undefined ||
    body.phone === undefined ||
    body.dob === undefined ||
    body.address === undefined ||
    body.city === undefined ||
    body.state === undefined ||
    body.zipCode === undefined
  ) {
    switch (undefined) {
      case body.profileImage:
        throw new BadRequestError("profileImage is required");
      case body.name:
        throw new BadRequestError("name is required");
      case body.email:
        throw new BadRequestError("email is required");
      case body.phone:
        throw new BadRequestError("phone is required");
      case body.dob:
        throw new BadRequestError("dob is required");
      case body.address:
        throw new BadRequestError("address is required");
      case body.city:
        throw new BadRequestError("city is required");
      case body.state:
        throw new BadRequestError("state is required");
      case body.zipCode:
        throw new BadRequestError("zipCode is required");
      default:
        throw new BadRequestError("All fields are required");
    }
  }
}
