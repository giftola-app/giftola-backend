const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");

const savedGiftsCollection = "savedGifts";

const saveGift = async (req, res) => {
  const { title, asin, price, image, link } = req.body;

  _validateSaveGiftReq(title, asin, price, image, link);

  const savedGiftsRef = await req.db
    .collection(savedGiftsCollection)
    .where("asin", "==", asin)
    .where("createdBy", "==", req.user.uid)
    .get();

  if (!savedGiftsRef.empty) {
    //delete the existing gift
    const savedGiftRef = savedGiftsRef.docs[0];
    await savedGiftRef.ref.delete();

    res.status(StatusCodes.OK).json({
      code: "unsave_gift",
      message: "Gift unsaved successfully",
    });
    return;
  }

  const savedGift = {
    ...req.body,
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  const savedGiftRef = await req.db
    .collection(savedGiftsCollection)
    .add(savedGift);

  res.status(StatusCodes.CREATED).json({
    code: "save_gift",
    message: "Gift saved successfully",
    data: { id: savedGiftRef.id, ...savedGift },
  });
};

const getSavedGifts = async (req, res) => {
  const savedGiftsRef = await req.db
    .collection(savedGiftsCollection)
    .where("createdBy", "==", req.user.uid)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const savedGifts = [];

  savedGiftsRef.forEach((savedGift) => {
    savedGifts.push({ id: savedGift.id, ...savedGift.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_saved_gifts",
    message: "Saved gifts retrieved successfully",
    data: savedGifts,
  });
};

function _validateSaveGiftReq(title, asin, price, image, link) {
  if (!title || !asin || !price || !image || !link) {
    switch (true) {
      case !title:
        throw new BadRequestError("Please provide a title");
      case !asin:
        throw new BadRequestError("Please provide an ASIN");
      case !price:
        throw new BadRequestError("Please provide a price");
      case !image:
        throw new BadRequestError("Please provide an image");
      case !link:
        throw new BadRequestError("Please provide a link");
      default:
        break;
    }
  }
}

module.exports = { saveGift, getSavedGifts };
