const NODE_STATUSES = {
  PENDING: "pending",
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped",
  CANCELED: "canceled"
};

const createExecutionState = (nodes = [], incomingEdgeMap = {}) => {
  const nodeStates = {};
  const remainingDependencies = {};
  const readyQueue = [];

  nodes.forEach((node) => {
    nodeStates[node.id] = {
      nodeId: node.id,
      status: NODE_STATUSES.PENDING,
      attempts: 0,
      startedAt: null,
      endedAt: null,
      duration: 0,
      error: null,
      retryAttempts: 0,
      loop: null,
      join: null
    };

    remainingDependencies[node.id] =
      incomingEdgeMap[node.id]?.length || 0;
  });

  const setStatus = (nodeId, status, patch = {}) => {
    if (!nodeStates[nodeId]) return;

    nodeStates[nodeId] = {
      ...nodeStates[nodeId],
      status,
      ...patch
    };
  };

  const enqueue = (nodeId) => {
    if (!nodeStates[nodeId]) return false;

    const state = nodeStates[nodeId];

    if (
      state.status !== NODE_STATUSES.PENDING &&
      state.status !== NODE_STATUSES.SKIPPED
    ) {
      return false;
    }

    if (readyQueue.includes(nodeId)) {
      return false;
    }

    setStatus(nodeId, NODE_STATUSES.QUEUED);
    readyQueue.push(nodeId);
    return true;
  };

  const dequeue = () => readyQueue.shift() || null;

  const markRunning = (nodeId) => {
    const startedAt = new Date();

    setStatus(nodeId, NODE_STATUSES.RUNNING, {
      attempts: (nodeStates[nodeId]?.attempts || 0) + 1,
      startedAt,
      endedAt: null,
      error: null
    });

    return startedAt;
  };

  const markCompleted = (nodeId, output, duration) => {
    setStatus(nodeId, NODE_STATUSES.COMPLETED, {
      output,
      duration,
      endedAt: new Date()
    });
  };

  const markFailed = (nodeId, error, duration) => {
    setStatus(nodeId, NODE_STATUSES.FAILED, {
      error,
      duration,
      endedAt: new Date()
    });
  };

  const markCanceled = (nodeId, reason) => {
    setStatus(nodeId, NODE_STATUSES.CANCELED, {
      error: reason || "Execution canceled",
      endedAt: new Date()
    });
  };

  const setNodeMetadata = (nodeId, patch = {}) => {
    setStatus(nodeId, nodeStates[nodeId]?.status, patch);
  };

  const decrementDependency = (nodeId) => {
    if (remainingDependencies[nodeId] === undefined) {
      return null;
    }

    remainingDependencies[nodeId] = Math.max(
      0,
      remainingDependencies[nodeId] - 1
    );

    return remainingDependencies[nodeId];
  };

  const markUnreachedAsSkipped = () => {
    Object.keys(nodeStates).forEach((nodeId) => {
      if (nodeStates[nodeId].status === NODE_STATUSES.PENDING) {
        setStatus(nodeId, NODE_STATUSES.SKIPPED);
      }
    });
  };

  return {
    nodeStates,
    remainingDependencies,
    readyQueue,
    enqueue,
    dequeue,
    markRunning,
    markCompleted,
    markFailed,
    markCanceled,
    setNodeMetadata,
    markUnreachedAsSkipped,
    decrementDependency,
    hasReadyNodes: () => readyQueue.length > 0
  };
};

module.exports = {
  NODE_STATUSES,
  createExecutionState
};
