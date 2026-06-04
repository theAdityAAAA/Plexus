const mongoose = require("mongoose");

const customNodeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, unique: true }, // e.g. "slack-notify"
    description: { type: String, default: "" },
    category: { type: String, default: "Custom" },
    icon: { type: String, default: "box" },
    color: { type: String, default: "#6c757d" },
    inputs: [{ type: String }],
    outputs: [{ type: String }],
    code: { type: String, required: true },
    version: { type: String, default: "v1.0" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CustomNode", customNodeSchema);
