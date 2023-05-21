const express = require("express");
const router = express.Router();

const { getGroups, getGroup } = require("../../controllers/admin/groups");

router.route("/").get(getGroups);

router.route("/:id").get(getGroup);

module.exports = router;
