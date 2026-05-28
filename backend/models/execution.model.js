const mongoose = require("mongoose");

const executionSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      unique: true
    },

    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workflow",
      required: true
    },

    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running"
    },

    input: {
      type: Object,
      default: {}
    },

    outputs: {
      type: Object,
      default: {}
    },

    logs: [
      {
        nodeId: String,
        status: String,
        output: mongoose.Schema.Types.Mixed,
        error: String,

        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],

    currentNodeId: {
      type: String,
      default: null
    },

    startedAt: {
      type: Date,
      default: Date.now
    },

    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Execution ||
  mongoose.model(
    "Execution",
    executionSchema
  );