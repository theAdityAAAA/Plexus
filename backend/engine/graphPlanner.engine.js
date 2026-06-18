const makeIssue = (code, severity, message, extra = {}) => ({
  code,
  severity,
  message,
  ...extra
});

const getWorkflowParts = (workflow = {}) => ({
  nodes: Array.isArray(workflow.nodes) ? workflow.nodes : [],
  edges: Array.isArray(workflow.edges) ? workflow.edges : []
});

const buildGraphPlan = (workflow) => {
  const { nodes, edges } = getWorkflowParts(workflow);
  const nodeMap = {};
  const edgeMap = {};
  const incomingEdgeMap = {};
  const duplicateNodeIds = [];

  nodes.forEach((node) => {
    if (nodeMap[node.id]) {
      duplicateNodeIds.push(node.id);
    }

    nodeMap[node.id] = node;
    edgeMap[node.id] = [];
    incomingEdgeMap[node.id] = [];
  });

  const invalidEdges = [];
  const missingNodes = new Set();
  const validEdges = [];

  edges.forEach((edge, index) => {
    const issues = [];

    if (!edge.source || !nodeMap[edge.source]) {
      issues.push("source");
      if (edge.source) missingNodes.add(edge.source);
    }

    if (!edge.target || !nodeMap[edge.target]) {
      issues.push("target");
      if (edge.target) missingNodes.add(edge.target);
    }

    if (issues.length > 0) {
      invalidEdges.push({
        index,
        source: edge.source || null,
        target: edge.target || null,
        issues
      });
      return;
    }

    validEdges.push(edge);
    edgeMap[edge.source].push(edge);
    incomingEdgeMap[edge.target].push(edge);
  });

  return {
    nodeMap,
    edgeMap,
    incomingEdgeMap,
    validEdges,
    invalidEdges,
    missingNodes: Array.from(missingNodes),
    duplicateNodeIds
  };
};

const detectCycles = (nodeMap, edgeMap) => {
  const visited = new Set();
  const visiting = new Set();
  const path = [];
  const cycles = [];
  const cycleKeys = new Set();

  const visit = (nodeId) => {
    if (visiting.has(nodeId)) {
      const startIndex = path.indexOf(nodeId);
      const cycle = [...path.slice(startIndex), nodeId];
      const key = cycle.join("->");

      if (!cycleKeys.has(key)) {
        cycleKeys.add(key);
        cycles.push(cycle);
      }

      return;
    }

    if (visited.has(nodeId)) return;

    visiting.add(nodeId);
    path.push(nodeId);

    (edgeMap[nodeId] || []).forEach((edge) => {
      visit(edge.target);
    });

    path.pop();
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  Object.keys(nodeMap).forEach(visit);

  return cycles;
};

const findReachableNodes = (roots, edgeMap) => {
  const reachable = new Set();
  const stack = [...roots];

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (reachable.has(nodeId)) continue;

    reachable.add(nodeId);

    (edgeMap[nodeId] || []).forEach((edge) => {
      stack.push(edge.target);
    });
  }

  return reachable;
};

const validateWorkflowGraph = (workflow) => {
  const { nodes, edges } = getWorkflowParts(workflow);
  const plan = buildGraphPlan(workflow);
  const nodeIds = Object.keys(plan.nodeMap);
  const roots = nodeIds.filter((nodeId) => plan.incomingEdgeMap[nodeId].length === 0);
  const cycles = detectCycles(plan.nodeMap, plan.edgeMap);
  const reachable = roots.length > 0
    ? findReachableNodes(roots, plan.edgeMap)
    : new Set();
  const unreachableNodes = nodeIds.filter((nodeId) => !reachable.has(nodeId));
  const warnings = [];
  const errors = [];

  if (plan.duplicateNodeIds.length > 0) {
    warnings.push(makeIssue(
      "DUPLICATE_NODE_ID",
      "warning",
      "Duplicate node ids were found. Execution will use the last node with each duplicate id.",
      { nodeIds: plan.duplicateNodeIds }
    ));
  }

  if (plan.invalidEdges.length > 0) {
    errors.push(makeIssue(
      "INVALID_EDGE_REFERENCE",
      "error",
      "One or more edges reference missing source or target nodes.",
      { edges: plan.invalidEdges }
    ));
  }

  if (plan.missingNodes.length > 0) {
    errors.push(makeIssue(
      "MISSING_NODE",
      "error",
      "The graph references nodes that do not exist in the workflow.",
      { nodeIds: plan.missingNodes }
    ));
  }

  if (nodes.length === 0) {
    errors.push(makeIssue(
      "EMPTY_WORKFLOW",
      "error",
      "Workflow has no nodes."
    ));
  } else if (roots.length === 0) {
    errors.push(makeIssue(
      "NO_ROOT_NODE",
      "error",
      "Workflow has no root node. This usually means every node has an incoming edge or the graph contains a cycle."
    ));
  } else if (roots.length > 1) {
    warnings.push(makeIssue(
      "MULTIPLE_ROOT_NODES",
      "warning",
      "Workflow has multiple root nodes. The current executor will start from the first root node it finds.",
      { nodeIds: roots }
    ));
  }

  if (cycles.length > 0) {
    errors.push(makeIssue(
      "CYCLE_DETECTED",
      "error",
      "One or more cycles were detected in the workflow graph.",
      { cycles }
    ));
  }

  if (unreachableNodes.length > 0 && roots.length > 0) {
    warnings.push(makeIssue(
      "UNREACHABLE_NODE",
      "warning",
      "Some nodes are not reachable from any root node.",
      { nodeIds: unreachableNodes }
    ));
  }

  return {
    valid: errors.length === 0,
    summary: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      validEdgeCount: plan.validEdges.length,
      invalidEdgeCount: plan.invalidEdges.length,
      rootCount: roots.length,
      unreachableNodeCount: unreachableNodes.length,
      cycleCount: cycles.length,
      warningCount: warnings.length,
      errorCount: errors.length
    },
    roots,
    missingNodes: plan.missingNodes,
    invalidEdges: plan.invalidEdges,
    unreachableNodes,
    cycles,
    warnings,
    errors
  };
};

module.exports = {
  buildGraphPlan,
  validateWorkflowGraph
};
