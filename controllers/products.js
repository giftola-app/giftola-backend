const StatusCodes = require("http-status-codes");
const { BadRequestError } = require("../errors");
const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");

const eventsCollection = "events";
const contactsCollection = "contacts";
const eventGiftsCollection = "eventGifts";

const getProducts = async (req, res) => {
  const { eventId, tag } = req.query;

  if (!eventId && !tag) {
    throw new BadRequestError(" eventId or tag is required");
  } else if (eventId && tag) {
    throw new BadRequestError(" eventId and tag cannot be used together");
  }

  if (tag) {
    const results = await _getProductsByCategory(tag);
    const data = results.data.search_results;

    data.forEach((item) => {
      item.link = `${item.link}${process.env.AFFILIATE_TAG}`;
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
  const noOfGifts = process.env.NO_OF_GIFTS_CHATGPT;
  // const preff

  const prompt = `Generate a list of ${noOfGifts} gift ideas with brand name and price in JSON format for a person with the following characteristics:Preferences:${JSON.stringify(
    preferences
  )}, Preffered Cost: ${prefferedCost}, Date of Birth: ${dob}, Interests:
    [${interests}]. Give answer in JSON format like this:
    [{"name": "Product 1",
            "brand": "Brand 1"},
            {"name": "Product 2",
                "brand": "Brand 2"}]`;

  const ideaList = await askChatGPT(prompt);

  const results = await _getRainforestProducts(ideaList, prefferedCost);
  const data = results.map((result) => result.data);

  // get top 10 items from each result
  data.forEach((result) => {
    result.search_results = result.search_results.slice(0, 10);
  });

  const giftCreationDate = new Date();
  data.forEach((result) => {
    result.search_results.forEach((item) => {
      item.id = Math.floor(Math.random() * 1000000);
      item.createdAt = giftCreationDate;
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

async function _getProductsByCategory(tag) {
  const API_KEY = process.env.RAINFOREST_API_KEY;
  const baseUrl = "https://api.rainforestapi.com";
  const endpoint = "/request";

  const config = {
    headers: {
      "User-Agent": "Axios 0.18.0",
      "Content-Type": "application/json",
    },
  };

  const url = `${baseUrl}${endpoint}?api_key=${API_KEY}&type=search&amazon_domain=amazon.com&search_term=${tag}&sort_by=price_low_to_high&pr_min=0&pr_max=1000`;

  const results = await axios.get(url, config);

  return results;
}

async function _getRainforestProducts(ideaList, prefferedCost) {
  const API_KEY = process.env.RAINFOREST_API_KEY;
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

async function askChatGPT(prompt) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt,
    max_tokens: 1000,
    temperature: 0,
  });
  let data = completion.data.choices[0].text.replace(/\n/g, "");

  //parse data to json
  data = JSON.parse(data.trim());

  return data;
}

module.exports = { getProducts };
