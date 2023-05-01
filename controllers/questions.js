const StatusCodes = require("http-status-codes");
const { BadRequestError } = require("../errors");

const questionsCollection = "questions";

const createQuestion = async (req, res) => {
  const { title, options } = req.body;

  _validateCreateQuestionFields(req.body);

  // const exampleModel = {
  //     'title': 'What is your favorite color?',
  //     'options': [
  //         'Red',
  //         'Blue',
  //         'Green',
  //         'Yellow'
  //     ]
  // };

  const question = {
    ...req.body,
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  const questionRef = await req.db
    .collection(questionsCollection)
    .add(question);

  res.status(StatusCodes.CREATED).json({
    code: "create_question",
    message: "Question created successfully",
    data: { id: questionRef.id, ...question },
  });
};

const getQuestions = async (req, res) => {
  if (req.query.id) {
    return getQuestion(req, res);
  }

  const questionsRef = await req.db
    .collection(questionsCollection)
    .where("createdBy", "==", req.user.uid)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const questions = [];

  questionsRef.forEach((question) => {
    questions.push({ id: question.id, ...question.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_questions",
    message: "Questions retrieved successfully",
    data: questions,
  });
};

const getQuestion = async (req, res) => {
  const questionId = req.params.id || req.query.id;

  const questionRef = await req.db
    .collection(questionsCollection)
    .doc(questionId)
    .get();

  if (!questionRef.exists) {
    throw new BadRequestError("Question does not exist");
  }

  const question = { id: questionRef.id, ...questionRef.data() };

  res.status(StatusCodes.OK).json({
    code: "get_question",
    message: "Question retrieved successfully",
    data: question,
  });
};

const updateQuestion = async (req, res) => {
  const questionId = req.params.id || req.query.id;

  const questionRef = await req.db
    .collection(questionsCollection)
    .doc(questionId)
    .get();

  if (!questionRef.exists) {
    throw new BadRequestError("Question does not exist");
  }

  delete req.body.id;
  delete req.body.createdBy;
  delete req.body.createdAt;
  delete req.body.deletedAt;

  const question = {
    ...req.body,
  };

  await req.db.collection(questionsCollection).doc(questionId).update(question);

  res.status(StatusCodes.OK).json({
    code: "update_question",
    message: "Question updated successfully",
    data: { id: questionRef.id },
  });
};

const deleteQuestion = async (req, res) => {
  const questionId = req.params.id || req.query.id;

  const questionRef = await req.db
    .collection(questionsCollection)
    .doc(questionId)
    .get();

  if (!questionRef.exists) {
    throw new BadRequestError("Question does not exist");
  }

  await req.db
    .collection(questionsCollection)
    .doc(questionId)
    .update({ deletedAt: req.admin.firestore.Timestamp.now() });

  res.status(StatusCodes.OK).json({
    code: "delete_question",
    message: "Question deleted successfully",
    data: { id: questionRef.id },
  });
};

const _validateCreateQuestionFields = (body) => {
  if (!body.title) {
    throw new BadRequestError("Title is required");
  }

  if (!body.options || body.options.length < 2) {
    throw new BadRequestError("Options are required");
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
};
