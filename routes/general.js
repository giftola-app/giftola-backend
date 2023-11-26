const express = require("express");
const router = express.Router();

const { createAppInvite } = require("../controllers/general");

router.get("/invite", createAppInvite);

module.exports = router;
