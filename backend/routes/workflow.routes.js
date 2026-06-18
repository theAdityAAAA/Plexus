const express = require("express");
const router = express.Router();

const workflowController = require("../controllers/workflow.controller");

const executorEngine = require("../engine/executor.engine");
const Workflow = require("../models/workflow.model");
const {
  validateWorkflowGraph
} = require("../engine/graphPlanner.engine");
// -----------------------------
// WEBHOOK TRIGGER
// -----------------------------

router.post(
  "/webhooks/:workflowId",
  async (req, res) => {
    try {
      const io = req.app.get("io");
      const workflow = await Workflow.findById(
        req.params.workflowId
      );
      const validation = workflow
        ? validateWorkflowGraph(workflow)
        : null;

      const executionId = await executorEngine(
        req.params.workflowId,
        io,
        req.body, // 🔥 webhook payload
        {
          executionMode:
            req.body?.executionMode ||
            req.query?.executionMode
        }
      );

      res.json({
        success: true,
        executionId,
        receivedData: req.body,
        validation
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
);

// -----------------------------
// Workflow CRUD
// -----------------------------
router.get("/", workflowController.getAllWorkflows);

router.post("/", workflowController.createWorkflow);

router.put("/:id", workflowController.updateWorkflow);

// -----------------------------
// Manual Execute
// -----------------------------
router.post(
  "/:id/execute",
  workflowController.executeWorkflow
);



module.exports = router;
