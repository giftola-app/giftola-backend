const express = require("express");

const router = express.Router();

const {
  getInterest,
  getInterests,
  updateInterest,
  deleteInterest,
} = require("../../controllers/admin/interests");

router.route("/").get(getInterests);

router
  .route("/:id")
  .get(getInterest)
  .patch(updateInterest)
  .delete(deleteInterest);

module.exports = router;
