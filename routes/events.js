const express = require("express");

const router = express.Router();

const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/events");

router
  .route("/")
  .post(createEvent)
  .get(getEvents)
  .patch(updateEvent)
  .delete(deleteEvent);

router.route("/:id").get(getEvent).patch(updateEvent).delete(deleteEvent);

module.exports = router;
