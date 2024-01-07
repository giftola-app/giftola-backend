const { StatusCodes } = require("http-status-codes");
const { UnauthenticatedError, BadRequestError } = require("../errors");

const notifyEveryone = async (req, res) => {
  //send notification on topic allusers
  const { admin } = req;

  const { title, body } = req.body;

  if (!title || !body) {
    throw new BadRequestError("Please provide all values");
  }
  const payload = {
    notification: {
      title,
      body,
    },
  };

  const topic = "allusers";

  admin
    .messaging()
    .sendToTopic(topic, payload)
    .then(function (response) {
      console.log("Successfully sent message:", response);
    })
    .catch(function (error) {
      console.log("Error sending message:", error);
    });

  res.status(StatusCodes.OK).json({ msg: "Notification sent" });
};

const notifyUser = async (req, res) => {
  //send notification on topic userId
  const { admin } = req;
  const { userId, title, body } = req.body;

  const payload = {
    notification: {
      title,
      body,
    },
  };
  const topic = userId;
  admin
    .messaging()
    .sendToTopic(topic, payload)
    .then(function (response) {
      console.log("Successfully sent message:", response);
    })
    .catch(function (error) {
      console.log("Error sending message:", error);
    });

  res.status(StatusCodes.OK).json({ msg: "Notification sent" });
};

module.exports = { notifyEveryone, notifyUser };
