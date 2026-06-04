const express = require("express");
const {
  getAllCustomNodes,
  createCustomNode,
  deleteCustomNode
} = require("../controllers/customNode.controller");

const router = express.Router();

router.route("/").get(getAllCustomNodes).post(createCustomNode);
router.route("/:id").delete(deleteCustomNode);

module.exports = router;
