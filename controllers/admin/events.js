const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../../errors");

const eventsCollection = "events";

const getEvents = async (req, res) => {
  if (req.query.id) {
    return getEvent(req, res);
  }

  const eventsRef = await req.db
    .collection(eventsCollection)
    .where("deletedAt", "==", null)
    .orderBy("createdAt", "desc")
    .get();

  const events = [];

  eventsRef.forEach((event) => {
    events.push({ id: event.id, ...event.data() });
  });

  res.status(StatusCodes.OK).json({
    code: "get_events",
    message: "Events retrieved successfully",
    data: events,
  });
};

const getEvent = async (req, res) => {
  const eventId = req.params.id || req.query.id;

  const eventRef = await req.db.collection(eventsCollection).doc(eventId).get();

  if (!eventRef.exists) {
    throw new BadRequestError("Event does not exist");
  }

  const eventDoc = eventRef.data();

  res.status(StatusCodes.OK).json({
    code: "get_event",
    message: "Event retrieved successfully",
    data: { id: eventRef.id, ...eventDoc },
  });
};

module.exports = { getEvents, getEvent };
