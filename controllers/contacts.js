const StatusCodes = require("http-status-codes");
const { UnauthenticatedError } = require("../errors");

const contactsCollection = "contacts";

const createContact = async (req, res) => {
  res.status(StatusCodes.OK).json(req.body);
};

const getContacts = async (req, res) => {
  res.status(StatusCodes.OK).json(req.body);
};

const getContact = async (req, res) => {
  res.status(StatusCodes.OK).json(req.body);
};

const updateContact = async (req, res) => {
  res.status(StatusCodes.OK).json(req.body);
};

const deleteContact = async (req, res) => {
  res.status(StatusCodes.OK).json(req.body);
};

module.exports = {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
};
