const express = require("express");
const router = express.Router();

const workflowController = require("../controllers/workflow.controller");

const executorEngine = require("../engine/executor.engine");
// -----------------------------
// WEBHOOK TRIGGER
// -----------------------------

router.post(
  "/webhooks/:workflowId",
  async (req, res) => {
    try {
      const io = req.app.get("io");

      const executionId = await executorEngine(
        req.params.workflowId,
        io,
        req.body // 🔥 webhook payload
      );

      res.json({
        success: true,
        executionId,
        receivedData: req.body
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

// -----------------------------
// Manual Execute
// -----------------------------
router.post(
  "/:id/execute",
  workflowController.executeWorkflow
);



module.exports = router;