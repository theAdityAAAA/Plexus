const express = require("express");
const {
  getExecutions,
  getExecutionById
} = require("../controllers/execution.controller");

const router = express.Router();

router.get("/", getExecutions);
router.get("/:executionId", getExecutionById);

module.exports = router;
