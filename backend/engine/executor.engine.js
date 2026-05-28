const Workflow = require("../models/workflow.model");
const Execution = require("../models/execution.model");

const nodeRegistry = require("../services/node.service");

const runningExecutions = new Map();

const delay = (ms) =>
  new Promise((res) => setTimeout(res, ms));

const executorEngine = async (
  workflowId,
  io,
  inputData = {}
) => {
  const executionId = Date.now().toString();

  // ---------------------------------
  // GLOBAL EXECUTION CONTEXT
  // ---------------------------------
  const executionContext = {
    executionId,
    workflowId,
    input: inputData,
    outputs: {},
    variables: {},
    logs: []
  };

  // ---------------------------------
  // STORE ACTIVE EXECUTION
  // ---------------------------------
  runningExecutions.set(executionId, {
    workflowId,
    currentNodeId: null,
    status: "running",
    context: executionContext
  });

  // ---------------------------------
  // CREATE EXECUTION DB RECORD
  // ---------------------------------
  await Execution.create({
    executionId,
    workflowId,
    status: "running",
    input: inputData,
    outputs: {},
    logs: [],
    startedAt: new Date()
  });

  console.log("Execution started:", executionId);

  // ---------------------------------
  // START EXECUTION
  // ---------------------------------
  await executeStep(executionId, io);

  return executionId;
};

const executeStep = async (executionId, io) => {
  const execution =
    runningExecutions.get(executionId);

  if (
    !execution ||
    execution.status !== "running"
  ) {
    return;
  }

  // ---------------------------------
  // EXECUTION CONTEXT
  // ---------------------------------
  const executionContext = execution.context;

  // ---------------------------------
  // HOT RELOAD WORKFLOW
  // ---------------------------------
  const workflow = await Workflow.findById(
    execution.workflowId
  );

  if (!workflow) {
    console.error("Workflow not found");

    execution.status = "failed";

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "failed",
        completedAt: new Date()
      }
    );

    return;
  }

  // ---------------------------------
  // BUILD NODE MAP
  // ---------------------------------
  const nodeMap = {};

  workflow.nodes.forEach((node) => {
    nodeMap[node.id] = node;
  });

  // ---------------------------------
  // BUILD EDGE MAP
  // ---------------------------------
  const edgeMap = {};

  workflow.edges.forEach((edge) => {
    if (!edgeMap[edge.source]) {
      edgeMap[edge.source] = [];
    }

    edgeMap[edge.source].push(edge);
  });

  // ---------------------------------
  // FIND START NODE
  // ---------------------------------
  if (!execution.currentNodeId) {
    const allTargets = workflow.edges.map(
      (e) => e.target
    );

    const startNode = workflow.nodes.find(
      (node) =>
        !allTargets.includes(node.id)
    );

    execution.currentNodeId =
      startNode?.id;
  }

  const currentNodeId =
    execution.currentNodeId;

  // ---------------------------------
  // EXECUTION FINISHED
  // ---------------------------------
  if (!currentNodeId) {
    execution.status = "completed";

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "completed",
        outputs: executionContext.outputs,
        completedAt: new Date()
      }
    );

    console.log(
      "Workflow execution finished 🚀"
    );

    return;
  }

  const node = nodeMap[currentNodeId];

  if (!node) {
    console.error(
      "Node not found:",
      currentNodeId
    );

    execution.status = "failed";

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "failed",
        completedAt: new Date()
      }
    );

    return;
  }

  // ---------------------------------
  // GET NODE HANDLER
  // ---------------------------------
  const handler =
    nodeRegistry[node.type];

  if (!handler) {
    console.error(
      "No handler for:",
      node.type
    );

    execution.status = "failed";

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "failed",
        completedAt: new Date()
      }
    );

    return;
  }

  // ---------------------------------
  // SOCKET STATUS → RUNNING
  // ---------------------------------
  io.emit("node-status", {
    node: currentNodeId,
    status: "running"
  });

  let result;

  try {
    // ---------------------------------
    // EXECUTE NODE
    // ---------------------------------
    result = await handler(
      node.config,
      executionContext
    );

    // ---------------------------------
    // STORE OUTPUT
    // ---------------------------------
    executionContext.outputs[
      currentNodeId
    ] = result;

    // ---------------------------------
    // STORE LOGS IN MEMORY
    // ---------------------------------
    executionContext.logs.push({
      nodeId: currentNodeId,
      status: "completed",
      output: result,
      timestamp: new Date()
    });

    // ---------------------------------
    // UPDATE EXECUTION DB
    // ---------------------------------
    await Execution.findOneAndUpdate(
      { executionId },
      {
        currentNodeId,

        outputs:
          executionContext.outputs,

        $push: {
          logs: {
            nodeId: currentNodeId,
            status: "completed",
            output: result,
            timestamp: new Date()
          }
        }
      }
    );
  } catch (err) {
    console.error(
      "Node execution failed:",
      err
    );

    io.emit("node-status", {
      node: currentNodeId,
      status: "failed"
    });

    executionContext.logs.push({
      nodeId: currentNodeId,
      status: "failed",
      error: err.message,
      timestamp: new Date()
    });

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "failed",

        $push: {
          logs: {
            nodeId: currentNodeId,
            status: "failed",
            error: err.message,
            timestamp: new Date()
          }
        },

        completedAt: new Date()
      }
    );

    execution.status = "failed";

    return;
  }

  // ---------------------------------
  // SOCKET STATUS → COMPLETED
  // ---------------------------------
  io.emit("node-status", {
    node: currentNodeId,
    status: "completed"
  });

  const outgoingEdges =
    edgeMap[currentNodeId];

  // ---------------------------------
  // END OF WORKFLOW
  // ---------------------------------
  if (
    !outgoingEdges ||
    outgoingEdges.length === 0
  ) {
    execution.status = "completed";

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "completed",
        outputs: executionContext.outputs,
        completedAt: new Date()
      }
    );

    console.log(
      "Workflow execution finished 🚀"
    );

    console.log(
      "Final Outputs:",
      executionContext.outputs
    );

    return;
  }

  // ---------------------------------
  // CONDITION NODE
  // ---------------------------------
  if (node.type === "condition") {
    const normalizedResult =
      String(result)
        .trim()
        .toLowerCase();

    const matchedEdge =
      outgoingEdges.find((edge) => {
        const branchValue = String(
          edge.data?.branch || ""
        )
          .trim()
          .toLowerCase();

        return (
          branchValue === normalizedResult
        );
      });

    if (!matchedEdge) {
      console.error(
        "No matching branch found for:",
        result
      );

      execution.status = "failed";

      await Execution.findOneAndUpdate(
        { executionId },
        {
          status: "failed",

          $push: {
            logs: {
              nodeId: currentNodeId,
              status: "failed",
              error:
                "No matching condition branch",
              timestamp: new Date()
            }
          },

          completedAt: new Date()
        }
      );

      return;
    }

    execution.currentNodeId =
      matchedEdge.target;
  } else {
    // ---------------------------------
    // DEFAULT NEXT NODE
    // ---------------------------------
    execution.currentNodeId =
      outgoingEdges[0].target;
  }

  // ---------------------------------
  // VISUAL EXECUTION DELAY
  // ---------------------------------
  await delay(500);

  // ---------------------------------
  // CONTINUE EXECUTION
  // ---------------------------------
  await executeStep(executionId, io);
};

module.exports = executorEngine;