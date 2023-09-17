const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../../errors");

const axios = require("axios");

const { Configuration, OpenAIApi } = require("openai");

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
    NO_OF_GIFTS_CHATGPT: 3,
    RAINFOREST_GIFTS: 20,
    OPENAI_KEY: "sk-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",
    RAINFOREST_KEY: "ED62BC3E53704A0BBAAEF403C88C95CE",
    CHATGPT_PROMPT: `Generate a list of {{noOfGifts}} gift ideas with brand
     name and price in JSON format for a person with the following characteristics:
      Preferences:{{preferences}} , Preffered Cost: {{preferredCost}},
       Date of Birth: {{dob}}, Interests:{{interests}}.
        Give answer in JSON format like this:[{"name": "Product 1","brand": "Brand 1"},
        {"name": "Product 2","brand": "Brand 2"}]`,
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

const checkOpenApiKeyValidity = async (req, res) => {
  const settingsRef = await req.db
    .collection(settingsCollection)
    .doc(settingsDoc)
    .get();

  if (!settingsRef.exists) {
    throw new BadRequestError("Settings does not exist");
  }

  const settingsData = settingsRef.data();

  const prompt = "Hello, my name is Saad. I am a human.";

  await askChatGPT(settingsData, prompt);

  res.status(StatusCodes.OK).json({
    code: "check_openapi_key_validity",
    message: "OpenAPI key is valid",
    data: { id: settingsRef.id, ...settingsData },
  });
};

const checkRainforestApiKeyValidity = async (req, res) => {
  const settingsRef = await req.db

    .collection(settingsCollection)
    .doc(settingsDoc)
    .get();

  if (!settingsRef.exists) {
    throw new BadRequestError("Settings does not exist");
  }

  const settingsData = settingsRef.data();

  const results = await _getRainforestProducts(settingsData);

  res.status(StatusCodes.OK).json({
    code: "check_rainforest_key_validity",
    message: "Rainforest key is valid",
    data: { id: settingsRef.id, ...settingsData },
  });
};

async function _getRainforestProducts(settingsData) {
  const API_KEY = settingsData.RAINFOREST_KEY;
  const baseUrl = "https://api.rainforestapi.com";
  const endpoint = "/request";
  const maxProducts = 2;

  const config = {
    headers: {
      "User-Agent": "Axios 0.18.0",
      "Content-Type": "application/json",
    },
  };

  const url = `${baseUrl}${endpoint}?api_key=${API_KEY}&type=search&amazon_domain=amazon.com&search_term=men&sort_by=price_low_to_high`;

  const results = await axios.get(url, config);

  return results;
}

async function askChatGPT(settingsData, prompt) {
  console.log(`OpenAI Key: ${settingsData.OPENAI_KEY}`);

  const configuration = new Configuration({
    apiKey: settingsData.OPENAI_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  let data = completion.data.choices[0].message.content;

  `Data: ${data}`;

  return data;
}

module.exports = {
  getSettings,
  updateSettings,
  resetDefaultSettings,
  checkOpenApiKeyValidity,
  checkRainforestApiKeyValidity,
};
