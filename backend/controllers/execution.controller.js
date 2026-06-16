const Execution = require("../models/execution.model");
const mongoose = require("mongoose");

const executionFields =
  "executionId workflowId status startedAt completedAt currentNodeId input outputs logs createdAt updatedAt";

const buildSearchFilter = (query) => {
  const filter = {};

  if (query.status && query.status !== "all") {
    filter.status = query.status;
  }

  if (query.search) {
    const term = query.search.trim();
    const search = new RegExp(term, "i");
    const conditions = [
      { executionId: search },
      { currentNodeId: search }
    ];

    if (mongoose.Types.ObjectId.isValid(term)) {
      conditions.push({ workflowId: term });
    }

    filter.$or = conditions;
  }

  return filter;
};

exports.getExecutions = async (req, res) => {
  try {
    const filter = buildSearchFilter(req.query);
    const limit = Math.min(parseInt(req.query.limit || "100", 10), 250);

    const executions = await Execution.find(filter)
      .select(executionFields)
      .sort({ startedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: executions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getExecutionById = async (req, res) => {
  try {
    const execution = await Execution.findOne({
      executionId: req.params.executionId
    })
      .select(executionFields)
      .lean();

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: "Execution not found"
      });
    }

    res.json({
      success: true,
      data: execution
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
