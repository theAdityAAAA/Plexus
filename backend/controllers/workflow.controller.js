const Workflow = require("../models/workflow.model");
const executorEngine = require("../engine/executor.engine");

/* =========================
   CREATE WORKFLOW
========================= */
exports.createWorkflow = async (req, res) => {
  try {
    const { name, nodes = [], edges = [] } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const workflow = new Workflow({
      name,
      nodes,
      edges
    });

    await workflow.save();

    res.status(201).json({
      success: true,
      data: workflow
    });

  } catch (error) {
    console.error("CREATE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   EXECUTE WORKFLOW
========================= */
exports.executeWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({ message: "Workflow not found" });
    }

    const io = req.app.get("io");

    // 🔥 DO NOT await (runtime engine is recursive)
    executorEngine(workflow._id, io);

    res.json({
      success: true,
      message: "Execution started"
    });

  } catch (error) {
    console.error("EXECUTION ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   GET ALL WORKFLOWS
========================= */
exports.getAllWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: workflows
    });

  } catch (error) {
    console.error("GET ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateWorkflow = async (req, res) => {
  try {
    const { name, nodes, edges } = req.body;

    const workflow =
      await Workflow.findByIdAndUpdate(
        req.params.id,
        {
          name,
          nodes,
          edges
        },
        { new: true }
      );

    res.json({
      success: true,
      data: workflow
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};