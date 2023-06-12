const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");

const eventsCollection = "events";
const contactsCollection = "contacts";
const eventGiftsCollection = "eventGifts";

const settingsCollection = "settings";
const settingsDoc = "giftola-settings";

const getProducts = async (req, res) => {
  const { eventId, tag, minPrice = 0.5, maxPrice = 1000 } = req.query;

  if (!eventId && !tag) {
    throw new BadRequestError(" eventId or tag is required");
  } else if (eventId && tag) {
    throw new BadRequestError(" eventId and tag cannot be used together");
  }

  const settingsRef = await req.db
    .collection(settingsCollection)
    .doc(settingsDoc)
    .get();

  if (!settingsRef.exists) {
    throw new BadRequestError("Settings does not exist");
  }

  const settingsData = settingsRef.data();

  if (tag) {
    const results = await _getProductsByTag(
      settingsData,
      tag,
      minPrice,
      maxPrice
    );
    const data = results.data.search_results;

    data.forEach((item) => {
      item.link = `${item.link}&tag=${settingsData.AFFILIATE_TAG}`;
    });

    res.status(StatusCodes.OK).json({
      code: "get_products",
      message: "Products retrieved successfully",
      data,
    });
    return;
  }
  const eventRef = await req.db.collection(eventsCollection).doc(eventId).get();
  if (!eventRef.exists) {
    throw new BadRequestError("Event does not exist");
  }
  const eventDoc = eventRef.data();

  const contactId = eventDoc.createdFor;
  const contactsRef = await req.db
    .collection(contactsCollection)
    .doc(contactId)
    .get();
  if (!contactsRef.exists) {
    throw new BadRequestError("Contact does not exist");
  }
  const contactsDoc = contactsRef.data();

  const eventGiftsRef = await req.db
    .collection(eventGiftsCollection)
    .where("eventId", "==", eventId)
    .get();

  if (!eventGiftsRef.empty) {
    const eventGiftsDoc = eventGiftsRef.docs[0].data();
    const giftList = eventGiftsDoc.giftList;

    //check if createdAt of eventGiftDoc is before contactsDoc.updatedAt
    if (eventGiftsDoc.createdAt < contactsDoc.updatedAt) {
      //get new gift list
    } else {
      res.status(StatusCodes.OK).json({
        code: "get_products",
        message: "Products retrieved successfully",
        data: giftList,
      });
      return;
    }
  }

  const interests = contactsDoc.selectedCategories;
  const preferences = contactsDoc.preferences;
  const dob = contactsDoc.dob;
  const prefferedCost = eventDoc.prefferedCost;
  const noOfGifts = settingsData.NO_OF_GIFTS_CHATGPT;

  let prompt = settingsData.CHATGPT_PROMPT;

  prompt = prompt.replace("{{noOfGifts}}", noOfGifts);
  prompt = prompt.replace("{{preferences}}", JSON.stringify(preferences));
  prompt = prompt.replace("{{prefferedCost}}", prefferedCost);
  prompt = prompt.replace("{{dob}}", dob);
  prompt = prompt.replace("{{interests}}", interests);

  //(`Prompt: ${prompt}`);

  const ideaList = await askChatGPT(settingsData, prompt);

  const results = await _getRainforestProducts(
    settingsData,
    ideaList,
    prefferedCost
  );
  const data = results.map((result) => result.data);

  data.forEach((result) => {
    result.search_results = result.search_results.slice(0, 10);
  });

  const giftCreationDate = new Date();
  data.forEach((result) => {
    result.search_results.forEach((item) => {
      item.id = Math.floor(Math.random() * 1000000);
      item.createdAt = giftCreationDate;
      item.link = `${item.link}&tag=${settingsData.AFFILIATE_TAG}`;
    });
  });

  const productList = data.map((result) => result.search_results).flat();

  // save gift list to db
  const eventGiftsDoc = {
    eventId,
    giftList: productList,
    createdAt: giftCreationDate,
    updatedAt: giftCreationDate,
    deletedAt: null,
  };

  await req.db.collection(eventGiftsCollection).doc(eventId).set(eventGiftsDoc);

  res.status(StatusCodes.OK).json({
    code: "get_products",
    message: "Products retrieved successfully",
    data: productList,
  });
};

async function _getProductsByTag(settingsData, tag, minPrice, maxPrice) {
  const API_KEY = settingsData.RAINFOREST_KEY;
  const baseUrl = "https://api.rainforestapi.com";
  const endpoint = "/request";

  const config = {
    headers: {
      "User-Agent": "Axios 0.18.0",
      "Content-Type": "application/json",
    },
  };

  const url = `${baseUrl}${endpoint}?api_key=${API_KEY}&type=search&amazon_domain=amazon.com&search_term=${tag}&sort_by=price_low_to_high&pr_min=${minPrice}&pr_max=${maxPrice}`;

  const results = await axios.get(url, config);

  return results;
}

async function _getRainforestProducts(settingsData, ideaList, prefferedCost) {
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

  const requests = ideaList.map((product) => {
    const query = `${product.brand} ${product.name}`;
    const url = `${baseUrl}${endpoint}?api_key=${API_KEY}&type=search&amazon_domain=amazon.com&search_term=${encodeURIComponent(
      query
    )}&sort_by=price_low_to_high&pr_min=0&pr_max=${prefferedCost}&num_results=${maxProducts}`;
    return axios.get(url, config);
  });

  const results = await Promise.all(requests);
  return results;
}

async function askChatGPT(settingsData, prompt) {
  //(`OpenAI Key: ${settingsData.OPENAI_KEY}`);
  const configuration = new Configuration({
    apiKey: settingsData.OPENAI_KEY,
  });
  const openai = new OpenAIApi(configuration);

  //(`OpenAI: ${openai}`);

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  let data = completion.data.choices[0].message.content;

  //(`Data: ${data}`);

  //parse data to json
  data = JSON.parse(data.trim().replace(/'/g, '"'));

  //(`Parsed Data: ${data}`);

  return data;
}

module.exports = { getProducts };
