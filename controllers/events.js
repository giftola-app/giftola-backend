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
    createdAt,
    deletedAt,
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
    req.params.id = req.query.id;
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
