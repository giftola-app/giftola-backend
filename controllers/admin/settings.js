const StatusCodes = require("http-status-codes");
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
  const { AFFILIATE_TAG, NO_OF_GIFTS_CHATGPT, RAINFOREST_GIFTS } = req.body;

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

module.exports = { getSettings, updateSettings };
