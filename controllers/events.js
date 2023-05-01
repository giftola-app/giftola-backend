const StatusCodes = require("http-status-codes");
const { UnauthenticatedError, BadRequestError } = require("../errors");

const eventsCollection = "events";

const createEvent = async (req, res) => {
  const {
    title,
    date,
    description,
    venue,
    coverImage,
    prefferedCost,
    createdFor,

    status,
  } = req.body;

  _validateCreateEventFields(req.body);

  const event = {
    ...req.body,
    createdBy: req.user.uid,
    createdAt: req.admin.firestore.Timestamp.now(),
    deletedAt: null,
  };

  const eventRef = await req.db.collection(eventsCollection).add(event);

  res.status(StatusCodes.CREATED).json({
    code: "create_event",
    message: "Event created successfully",
    data: { id: eventRef.id, ...event },
  });
};

const getEvents = async (req, res) => {
  if (req.query.id) {
    return getEvent(req, res);
  }

  const eventsRef = await req.db
    .collection(eventsCollection)
    .where("createdBy", "==", req.user.uid)
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

  _validateEventAccess(eventDoc, req);

  const event = { id: eventRef.id, ...eventRef.data() };

  res.status(StatusCodes.OK).json({
    code: "get_event",
    message: "Event retrieved successfully",
    data: event,
  });
};

const updateEvent = async (req, res) => {
  const eventId = req.params.id || req.query.id;

  const eventRef = await req.db.collection(eventsCollection).doc(eventId).get();

  if (!eventRef.exists) {
    throw new BadRequestError("Event does not exist");
  }

  const eventDoc = eventRef.data();

  _validateEventAccess(eventDoc, req);

  delete req.body.createdBy;
  delete req.body.createdAt;
  delete req.body.deletedAt;
  delete req.body.createdFor;

  await eventRef.ref.update(req.body);

  res.status(StatusCodes.OK).json({
    code: "update_event",
    message: "Event updated successfully",
    data: { id: eventRef.id },
  });
};

const deleteEvent = async (req, res) => {
  const eventId = req.params.id || req.query.id;

  const eventRef = await req.db.collection(eventsCollection).doc(eventId).get();

  if (!eventRef.exists) {
    throw new BadRequestError("Event does not exist");
  }

  const eventDoc = eventRef.data();

  _validateEventAccess(eventDoc, req);

  await eventRef.ref.update({ deletedAt: req.admin.firestore.Timestamp.now() });

  res.status(StatusCodes.OK).json({
    code: "delete_event",
    message: "Event deleted successfully",
    data: { id: eventRef.id },
  });
};

module.exports = { createEvent, getEvents, getEvent, updateEvent, deleteEvent };

function _validateEventAccess(eventDoc, req) {
  if (eventDoc.deletedAt) {
    throw new BadRequestError("No event found");
  } else if (eventDoc.createdBy !== req.user.uid) {
    throw new BadRequestError("You are not authorized to view this event");
  }
}

function _validateCreateEventFields(event) {
  switch (true) {
    case !event.title:
      throw new BadRequestError("Event title is required");
    case !event.date:
      throw new BadRequestError("Event date is required");
    case !event.description:
      throw new BadRequestError("Event description is required");
    case !event.venue:
      throw new BadRequestError("Event venue is required");
    case !event.coverImage:
      throw new BadRequestError("Event cover image is required");
    case !event.prefferedCost:
      throw new BadRequestError("Event preffered cost is required");
    case !event.createdFor:
      throw new BadRequestError("Event created for is required");
    default:
      return;
  }
}
