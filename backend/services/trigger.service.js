const cron = require('node-cron');
const Workflow = require('../models/workflow.model');
const executorEngine = require('../engine/executor.engine');
const {
  validateWorkflowGraph
} = require('../engine/graphPlanner.engine');

// Store active cron jobs to prevent duplicates and allow reloading
const activeCronJobs = new Map();

exports.initTriggers = (app, io) => {
  // ---------------------------------
  // 1. HTTP REQUEST / WEBHOOK TRIGGER
  // ---------------------------------
  app.all('/api/webhooks/:workflowId', async (req, res) => {
    try {
      const { workflowId } = req.params;
      const workflow = await Workflow.findById(workflowId);
      
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      console.log(`[Webhook] Triggered for workflow: ${workflowId}`);
      const validation = validateWorkflowGraph(workflow);
      
      // Pass the request body/query as input
      const inputData = {
        method: req.method,
        body: req.body,
        query: req.query,
        headers: req.headers
      };

      // Start workflow
      const executionId = await executorEngine(
        workflowId,
        io,
        inputData,
        {
          executionMode:
            req.body?.executionMode ||
            req.query?.executionMode
        }
      );

      res.status(200).json({ 
        message: "Workflow triggered successfully", 
        executionId,
        validation
      });

    } catch (err) {
      console.error("[Webhook Error]:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------
  // 2. SCHEDULE / CRON TRIGGER
  // ---------------------------------
  const scheduleWorkflows = async () => {
    try {
      const workflows = await Workflow.find({});
      
      workflows.forEach(workflow => {
        // Find if this workflow has a schedule node
        const scheduleNodes = workflow.nodes.filter(n => n.type === 'schedule');
        
        scheduleNodes.forEach(node => {
          // E.g. config.cronExpression or default to every hour if missing
          const cronExp = node.config?.cronExpression || "0 * * * *"; 
          
          const jobId = `${workflow._id}_${node.id}`;

          // Cancel existing job if we are reloading
          if (activeCronJobs.has(jobId)) {
            activeCronJobs.get(jobId).stop();
            activeCronJobs.delete(jobId);
          }

          if (node.config?.isActive !== false) {
            console.log(`[Cron] Scheduling workflow ${workflow._id} on ${cronExp}`);
            const job = cron.schedule(cronExp, async () => {
              console.log(`[Cron] Triggering workflow: ${workflow._id}`);
              const validation = validateWorkflowGraph(workflow);
              if (!validation.valid || validation.warnings.length > 0) {
                console.log("[Cron] Graph validation report:", validation);
              }
              const inputData = { triggeredAt: new Date().toISOString() };
              await executorEngine(workflow._id, io, inputData);
            });
            activeCronJobs.set(jobId, job);
          }
        });
      });
    } catch (err) {
      console.error("[Cron Initialization Error]:", err);
    }
  };

  // Initialize schedules
  scheduleWorkflows();

  // Expose reload function to API so we can reload schedules when workflows are updated
  app.post('/api/triggers/reload', async (req, res) => {
    await scheduleWorkflows();
    res.status(200).json({ message: "Triggers reloaded successfully" });
  });

  console.log("External trigger systems initialized 🚀");
};
