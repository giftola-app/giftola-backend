const StatusCodes = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../../errors");

const interestsCollection = "categories";

const getInterests = async (req, res) => {
  if (req.query.id) {
    return getInterest(req, res);
  }

  const interestsRef = await req.db
    .collection(interestsCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const interests = [];

  interestsRef.forEach((interest) => {
    interests.push({ id: interest.id, ...interest.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_interests",
    message: "Interests retrieved successfully",
    data: interests,
  });
};

const getInterest = async (req, res) => {
  const interestId = req.params.id || req.query.id;

  const interestRef = await req.db
    .collection(interestsCollection)
    .doc(interestId)
    .get();

  if (!interestRef.exists) {
    throw new BadRequestError("Interest does not exist");
  }

  const interestDoc = interestRef.data();

  res.status(StatusCodes.OK).json({
    code: "get_interest",
    message: "Interest retrieved successfully",
    data: { id: interestRef.id, ...interestDoc },
  });
};

const updateInterest = async (req, res) => {
  const interestId = req.params.id || req.query.id;

  const interestRef = await req.db

    .collection(interestsCollection)
    .doc(interestId)
    .get();

  if (!interestRef.exists) {
    throw new BadRequestError("Interest does not exist");
  }

  const interestDoc = interestRef.data();

  await interestRef.ref.update(req.body);

  res.status(StatusCodes.OK).json({
    code: "update_interest",
    message: "Interest updated successfully",
    data: { id: interestRef.id, ...interestDoc },
  });
};

const deleteInterest = async (req, res) => {
  const interestId = req.params.id || req.query.id;

  const interestRef = await req.db
    .collection(interestsCollection)
    .doc(interestId)
    .get();

  if (!interestRef.exists) {
    throw new BadRequestError("Interest does not exist");
  }

  const interestDoc = interestRef.data();

  await interestRef.ref.update({
    deletedAt: req.admin.firestore.Timestamp.now(),
  });

  res.status(StatusCodes.OK).json({
    code: "delete_interest",
    message: "Interest deleted successfully",
    data: { id: interestRef.id, ...interestDoc },
  });
};

module.exports = { getInterests, getInterest, updateInterest, deleteInterest };
