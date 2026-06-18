const Workflow = require("../models/workflow.model");
const Execution = require("../models/execution.model");
const CustomNode = require("../models/customNode.model");
const { executeInSandbox } = require("../services/sandbox.service");
const crypto = require("crypto");

const {
  resolveVariables
} = require(
  "../services/variableResolver.service"
);
const nodeRegistry = require("../services/node.service");
const {
  buildGraphPlan
} = require("./graphPlanner.engine");
const {
  createExecutionState
} = require("./executionState.engine");

const runningExecutions = new Map();

const delay = (ms) =>
  new Promise((res) => setTimeout(res, ms));

const getExecutionMode = (options = {}) => {
  const mode =
    options.executionMode ||
    process.env.EXECUTION_MODE ||
    "legacy";

  return mode === "dag" ? "dag" : "legacy";
};

const legacyExecutorEngine = async (
  workflowId,
  io,
  inputData = {}
) => {
  const executionId = crypto.randomUUID();

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

    runningExecutions.delete(executionId);
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

    runningExecutions.delete(executionId);
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

    runningExecutions.delete(executionId);
    return;
  }

  // ---------------------------------
  // GET NODE HANDLER / CUSTOM NODE
  // ---------------------------------
  let handler = nodeRegistry[node.type];
  let customNode = null;

  if (!handler) {
    customNode = await CustomNode.findOne({ type: node.type });
    if (!customNode) {
      console.error("No handler or custom node for:", node.type);
      execution.status = "failed";
      await Execution.findOneAndUpdate(
        { executionId },
        { status: "failed", completedAt: new Date() }
      );
      runningExecutions.delete(executionId);
      return;
    }
  }

  // ---------------------------------
  // SOCKET STATUS → RUNNING
  // ---------------------------------
 console.log("EMIT RUNNING:", currentNodeId);

io.emit("node-status", {
  node: currentNodeId,
  status: "running"
});

  const startTime = Date.now();
  let duration = 0;


  let result;

  try {
    // ---------------------------------
    // EXECUTE CORE LOGIC
    // ---------------------------------
  if (handler) {

const resolvedConfig =
  resolveVariables(
    node.config || {},
    executionContext
  );
console.log(
  "RAW CONFIG:",
  node.config
);

console.log("RESOLVED CONFIG:", resolvedConfig)


result = await handler(
  resolvedConfig,
  executionContext
);

} else {

  result = executionContext.input;

}
    // ---------------------------------
    // EXECUTE USER HOOK / CUSTOM CODE
    // ---------------------------------
    const userCode = node.userCode || (customNode ? customNode.code : null);
    if (userCode) {
      console.log(`Executing sandbox for node: ${currentNodeId}`);
      result = await executeInSandbox(userCode, result, executionContext);
    }

 const endTime = Date.now();
duration = endTime - startTime;

    // ---------------------------------
    // STORE OUTPUT
    // ---------------------------------


const outputKey =
  node.alias &&
  node.alias.trim() !== ""
    ? node.alias
    : currentNodeId;

executionContext.outputs[
  outputKey
] = result;
    // ---------------------------------
    // STORE LOGS IN MEMORY
    // ---------------------------------
    executionContext.logs.push({
      nodeId: currentNodeId,
      status: "completed",
      output: result,
      duration,
      startedAt: new Date(startTime),
      endedAt: new Date(endTime),
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
            duration,
            startedAt: new Date(startTime),
            endedAt: new Date(endTime),
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
    const endTime = Date.now();
duration = endTime - startTime;

    io.emit("node-status", {
      node: currentNodeId,
      status: "failed",
      error: err.message,
      duration
    });

    executionContext.logs.push({
      nodeId: currentNodeId,
      status: "failed",
      error: err.message,
      duration,
      startedAt: new Date(startTime),
      endedAt: new Date(endTime),
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
            duration,
            startedAt: new Date(startTime),
            endedAt: new Date(endTime),
            timestamp: new Date()
          }
        },

        completedAt: new Date()
      }
    );

    execution.status = "failed";

    runningExecutions.delete(executionId);
    return;
  }

  // ---------------------------------
  // SOCKET STATUS → COMPLETED
  // ---------------------------------
console.log("EMIT COMPLETED:", currentNodeId);

io.emit("node-status", {
   node: currentNodeId,
   status: "completed",
  output: result,
  duration
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

    runningExecutions.delete(executionId);
    return;
  }

  // ---------------------------------
  // CONDITION OR SWITCH NODE
  // ---------------------------------
  if (node.type === "condition" || node.type === "switch") {
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
  error: `No matching branch found for: ${result}`,
  timestamp: new Date()
}
          },

          completedAt: new Date()
        }
      );

      runningExecutions.delete(executionId);
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

const createExecutionContext = (
  executionId,
  workflowId,
  inputData
) => ({
  executionId,
  workflowId,
  input: inputData,
  outputs: {},
  variables: {},
  logs: []
});

const createExecutionRecord = async (
  executionId,
  workflowId,
  inputData
) => {
  await Execution.create({
    executionId,
    workflowId,
    status: "running",
    input: inputData,
    outputs: {},
    logs: [],
    startedAt: new Date()
  });
};

const getNodeHandler = async (node) => {
  const handler = nodeRegistry[node.type];

  if (handler) {
    return { handler, customNode: null };
  }

  const customNode = await CustomNode.findOne({
    type: node.type
  });

  if (!customNode) {
    throw new Error(
      `No handler or custom node for: ${node.type}`
    );
  }

  return { handler: null, customNode };
};

const getOutputKeyForNode = (node) =>
  node.alias && node.alias.trim() !== ""
    ? node.alias
    : node.id;

const buildMergeInput = (
  node,
  incomingEdgeMap,
  nodeMap,
  executionContext
) => {
  if (node.type !== "merge") {
    return executionContext.input;
  }

  const incomingEdges =
    incomingEdgeMap[node.id] || [];
  const inputs = {};
  const sources = [];

  incomingEdges.forEach((edge) => {
    const sourceNode = nodeMap[edge.source];
    if (!sourceNode) return;

    const outputKey =
      getOutputKeyForNode(sourceNode);

    sources.push({
      nodeId: edge.source,
      outputKey
    });

    inputs[outputKey] =
      executionContext.outputs[outputKey];
  });

  return {
    inputs,
    sources,
    sourceCount: sources.length
  };
};

const executeNodeForDag = async ({
  node,
  executionId,
  executionContext,
  io,
  state,
  nodeInput
}) => {
  const currentNodeId = node.id;

  runningExecutions.get(executionId).currentNodeId =
    currentNodeId;

  state.markRunning(currentNodeId);

  console.log("EMIT RUNNING:", currentNodeId);

  io.emit("node-status", {
    node: currentNodeId,
    status: "running"
  });

  const startTime = Date.now();
  let duration = 0;

  try {
    const { handler, customNode } =
      await getNodeHandler(node);
    const handlerContext = {
      ...executionContext,
      input:
        nodeInput === undefined
          ? executionContext.input
          : nodeInput
    };

    let result;

    if (handler) {
      const resolvedConfig = resolveVariables(
        node.config || {},
        executionContext
      );

      console.log("RAW CONFIG:", node.config);
      console.log("RESOLVED CONFIG:", resolvedConfig);

      result = await handler(
        resolvedConfig,
        handlerContext
      );
    } else {
      result = handlerContext.input;
    }

    const userCode =
      node.userCode ||
      (customNode ? customNode.code : null);

    if (userCode) {
      console.log(
        `Executing sandbox for node: ${currentNodeId}`
      );
      result = await executeInSandbox(
        userCode,
        result,
        handlerContext
      );
    }

    const endTime = Date.now();
    duration = endTime - startTime;

    const outputKey = getOutputKeyForNode(node);

    executionContext.outputs[outputKey] = result;
    state.markCompleted(
      currentNodeId,
      result,
      duration
    );

    const log = {
      nodeId: currentNodeId,
      status: "completed",
      output: result,
      duration,
      startedAt: new Date(startTime),
      endedAt: new Date(endTime),
      timestamp: new Date()
    };

    executionContext.logs.push(log);

    await Execution.findOneAndUpdate(
      { executionId },
      {
        currentNodeId,
        outputs: executionContext.outputs,
        $push: { logs: log }
      }
    );

    console.log("EMIT COMPLETED:", currentNodeId);

    io.emit("node-status", {
      node: currentNodeId,
      status: "completed",
      output: result,
      duration
    });

    return result;
  } catch (err) {
    console.error("Node execution failed:", err);

    const endTime = Date.now();
    duration = endTime - startTime;

    state.markFailed(
      currentNodeId,
      err.message,
      duration
    );

    io.emit("node-status", {
      node: currentNodeId,
      status: "failed",
      error: err.message,
      duration
    });

    const log = {
      nodeId: currentNodeId,
      status: "failed",
      error: err.message,
      duration,
      startedAt: new Date(startTime),
      endedAt: new Date(endTime),
      timestamp: new Date()
    };

    executionContext.logs.push(log);

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "failed",
        $push: { logs: log },
        completedAt: new Date()
      }
    );

    throw err;
  }
};

const failDagExecution = async (
  executionId,
  message,
  nodeId = null
) => {
  await Execution.findOneAndUpdate(
    { executionId },
    {
      status: "failed",
      $push: {
        logs: {
          nodeId,
          status: "failed",
          error: message,
          timestamp: new Date()
        }
      },
      completedAt: new Date()
    }
  );
};

const getRootNodeIds = (plan) =>
  Object.keys(plan.nodeMap).filter(
    (nodeId) =>
      (plan.incomingEdgeMap[nodeId] || []).length === 0
  );

const getSelectedEdges = (
  node,
  result,
  outgoingEdges
) => {
  if (!outgoingEdges || outgoingEdges.length === 0) {
    return [];
  }

  if (
    node.type === "condition" ||
    node.type === "switch"
  ) {
    const normalizedResult = String(result)
      .trim()
      .toLowerCase();

    const matchedEdge = outgoingEdges.find((edge) => {
      const branchValue = String(
        edge.data?.branch || ""
      )
        .trim()
        .toLowerCase();

      return branchValue === normalizedResult;
    });

    if (!matchedEdge) {
      throw new Error(
        `No matching branch found for: ${result}`
      );
    }

    return [matchedEdge];
  }

  return outgoingEdges;
};

const dagExecutorEngine = async (
  workflowId,
  io,
  inputData = {}
) => {
  const executionId = crypto.randomUUID();
  const executionContext = createExecutionContext(
    executionId,
    workflowId,
    inputData
  );

  runningExecutions.set(executionId, {
    workflowId,
    currentNodeId: null,
    status: "running",
    mode: "dag",
    context: executionContext
  });

  await createExecutionRecord(
    executionId,
    workflowId,
    inputData
  );

  console.log("DAG execution started:", executionId);

  const workflow = await Workflow.findById(workflowId);

  if (!workflow) {
    await failDagExecution(
      executionId,
      "Workflow not found"
    );
    runningExecutions.delete(executionId);
    return executionId;
  }

  const plan = buildGraphPlan(workflow);
  const rootNodeIds = getRootNodeIds(plan);
  const state = createExecutionState(
    workflow.nodes,
    plan.incomingEdgeMap
  );

  runningExecutions.get(executionId).state = state;

  rootNodeIds.forEach((nodeId) => state.enqueue(nodeId));

  if (rootNodeIds.length === 0) {
    state.markUnreachedAsSkipped();

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "completed",
        outputs: executionContext.outputs,
        completedAt: new Date()
      }
    );

    runningExecutions.delete(executionId);
    return executionId;
  }

  try {
    while (
      state.hasReadyNodes() &&
      runningExecutions.get(executionId)?.status ===
        "running"
    ) {
      const nodeId = state.dequeue();
      const node = plan.nodeMap[nodeId];

      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      const nodeInput = buildMergeInput(
        node,
        plan.incomingEdgeMap,
        plan.nodeMap,
        executionContext
      );

      const result = await executeNodeForDag({
        node,
        executionId,
        executionContext,
        io,
        state,
        nodeInput
      });

      const outgoingEdges = plan.edgeMap[nodeId] || [];
      const selectedEdges = getSelectedEdges(
        node,
        result,
        outgoingEdges
      );

      selectedEdges.forEach((edge) => {
        const remaining =
          state.decrementDependency(edge.target);

        if (remaining === 0) {
          state.enqueue(edge.target);
        }
      });
    }

    state.markUnreachedAsSkipped();

    await Execution.findOneAndUpdate(
      { executionId },
      {
        status: "completed",
        outputs: executionContext.outputs,
        completedAt: new Date()
      }
    );

    console.log("DAG workflow execution finished");
    console.log("Final Outputs:", executionContext.outputs);
  } catch (err) {
    runningExecutions.get(executionId).status =
      "failed";

    const currentNodeId =
      runningExecutions.get(executionId)
        ?.currentNodeId || null;

    const alreadyLogged =
      executionContext.logs.some(
        (log) =>
          log.status === "failed" &&
          log.nodeId === currentNodeId &&
          log.error === err.message
      );

    if (!alreadyLogged) {
      await failDagExecution(
        executionId,
        err.message,
        currentNodeId
      );
    }
  }

  runningExecutions.delete(executionId);
  return executionId;
};

const executorEngine = async (
  workflowId,
  io,
  inputData = {},
  options = {}
) => {
  const executionMode = getExecutionMode(options);

  if (executionMode === "dag") {
    return dagExecutorEngine(workflowId, io, inputData);
  }

  return legacyExecutorEngine(workflowId, io, inputData);
};

module.exports = executorEngine;
