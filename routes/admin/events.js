const express = require("express");
const router = express.Router();

const { getEvents, getEvent } = require("../../controllers/admin/events");

router.route("/").get(getEvents);

router.route("/:id").get(getEvent);

module.exports = router;
