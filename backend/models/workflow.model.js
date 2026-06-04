const mongoose = require("mongoose");

/* =========================
   NODE SCHEMA
========================= */
const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  config: { type: Object, default: {} }
});

/* =========================
   EDGE SCHEMA (FIXED)
========================= */
const edgeSchema = new mongoose.Schema({
  source: { type: String, required: true },
  target: { type: String, required: true },
  data: {
    branch: { type: String }
  }
});

/* =========================
   WORKFLOW SCHEMA
========================= */
const workflowSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nodes: [nodeSchema],
    edges: [edgeSchema],
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workflow", workflowSchema);
