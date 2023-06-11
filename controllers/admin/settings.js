const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../../errors");

const settingsCollection = "settings";

const settingsDoc = "giftola-settings";

const getSettings = async (req, res) => {
  const settingsRef = await req.db
    .collection(settingsCollection)
    .doc(settingsDoc)
    .get();

  if (!settingsRef.exists) {
    throw new BadRequestError("Settings does not exist");
  }

  const settingsData = settingsRef.data();

  res.status(StatusCodes.OK).json({
    code: "get_settings",
    message: "Settings retrieved successfully",
    data: { id: settingsRef.id, ...settingsData },
  });
};

const updateSettings = async (req, res) => {
  const settingsRef = await req.db
    .collection(settingsCollection)
    .doc(settingsDoc)
    .get();

  if (!settingsRef.exists) {
    throw new BadRequestError("Settings does not exist");
  }

  const settings = { ...req.body };

  await settingsRef.ref.update(settings);

  res.status(StatusCodes.OK).json({
    code: "update_settings",
    message: "Settings updated successfully",
    data: { id: settingsRef.id },
  });
};

const resetDefaultSettings = async (req, res) => {
  const settings = {
    AFFILIATE_TAG: "saad0259-20",
    NO_OF_GIFTS_CHATGPT: 10,
    RAINFOREST_GIFTS: 16,
    OPENAI_KEY: "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",
    RAINFOREST_KEY: "372527ECFD854A1399FA3CCD6C74BEA8",
    CHATGPT_PROMPT:
      'Generate a list of $noOfGifts gift ideas with brand name and price in JSON format for a person with the following characteristics:Preferences:$prefs, Preffered Cost: $prefferedCost, Date of Birth: $dob, Interests:$interests. Give answer in JSON format like this:[{"name": "Product 1","brand": "Brand 1"},{"name": "Product 2","brand": "Brand 2"}]',
  };

  await req.db
    .collection(settingsCollection)
    .doc(settingsDoc)
    .set(settings, { merge: true });

  res.status(StatusCodes.OK).json({
    code: "reset_settings",
    message: "Settings reset successfully",
    data: { id: settingsDoc },
  });
};
module.exports = { getSettings, updateSettings, resetDefaultSettings };
