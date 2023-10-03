const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");

const savedGiftIdeaCollection = "savedGiftIdeas";

const saveGiftIdea = async (req, res) => {
  const { title, price, image, link } = req.body;

  _validateSaveGiftIdeaReq(title, price, image, link);

  const savedGiftIdea = {
    ...req.body,
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  const savedGiftIdeaRef = await req.db
    .collection(savedGiftIdeaCollection)
    .add(savedGiftIdea);

  res.status(StatusCodes.CREATED).json({
    code: "save_gift_idea",
    message: "Gift idea saved successfully",
    data: { id: savedGiftIdeaRef.id, ...savedGiftIdea },
  });
};

const getSavedGiftIdeas = async (req, res) => {
  const savedGiftIdeasRef = await req.db
    .collection(savedGiftIdeaCollection)
    .where("createdBy", "==", req.user.uid)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const savedGiftIdeas = [];

  savedGiftIdeasRef.forEach((savedGiftIdea) => {
    savedGiftIdeas.push({ id: savedGiftIdea.id, ...savedGiftIdea.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_saved_gift_ideas",
    message: "Gift ideas fetched successfully",
    data: savedGiftIdeas,
  });
};

const updateSavedGiftIdea = async (req, res) => {
  const id = req.params.id || req.query.id;
  const { title, price, image, link } = req.body;

  const savedGiftIdeaRef = await req.db
    .collection(savedGiftIdeaCollection)
    .doc(id)
    .get();

  if (!savedGiftIdeaRef.exists) {
    throw new BadRequestError("Gift idea does not exist");
  }

  if (savedGiftIdeaRef.data().createdBy !== req.user.uid) {
    throw new BadRequestError("Gift idea does not belong to user");
  }

  await savedGiftIdeaRef.ref.update({
    ...req.body,
  });

  res.status(StatusCodes.OK).json({
    code: "update_saved_gift_idea",
    message: "Gift idea updated successfully",
  });
};

const deleteSavedGiftIdea = async (req, res) => {
  const id = req.params.id || req.query.id;

  if (!id) {
    throw new BadRequestError("Gift idea Id is required");
  }

  const savedGiftIdeaRef = await req.db
    .collection(savedGiftIdeaCollection)
    .doc(id)
    .get();

  if (!savedGiftIdeaRef.exists) {
    throw new BadRequestError("Gift idea does not exist");
  }

  if (savedGiftIdeaRef.data().createdBy !== req.user.uid) {
    throw new BadRequestError("Gift idea does not belong to user");
  }

  await savedGiftIdeaRef.ref.update({
    deletedAt: req.admin.firestore.Timestamp.now(),
  });

  res.status(StatusCodes.OK).json({
    code: "delete_saved_gift_idea",
    message: "Gift idea deleted successfully",
  });
};

function _validateSaveGiftIdeaReq(title, price, image, link) {
  if (!title || !price || !image || !link) {
    switch (true) {
      case !title:
        throw new BadRequestError("Please provide a title");
      case !price:
        throw new BadRequestError("Please provide a price");
      case !image:
        throw new BadRequestError("Please provide an image");
      case !link:
        throw new BadRequestError("Please provide a link");
    }
  }
}

module.exports = {
  saveGiftIdea,
  getSavedGiftIdeas,
  updateSavedGiftIdea,
  deleteSavedGiftIdea,
};
