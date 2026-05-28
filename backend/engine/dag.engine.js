const topologicalSort = (nodes, edges) => {
  const adjList = {};
  const inDegree = {};

  // Initialize
  nodes.forEach(node => {
    adjList[node] = [];
    inDegree[node] = 0;
  });

  // Build graph safely
  edges.forEach(([source, target]) => {
    if (!adjList[source]) {
      throw new Error(`Invalid source node: ${source}`);
    }

    if (inDegree[target] === undefined) {
      throw new Error(`Invalid target node: ${target}`);
    }

    adjList[source].push(target);
    inDegree[target] += 1;
  });

  const queue = [];
  const result = [];

  // Add nodes with zero in-degree
  nodes.forEach(node => {
    if (inDegree[node] === 0) {
      queue.push(node);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift();
    result.push(current);

    adjList[current].forEach(neighbor => {
      inDegree[neighbor] -= 1;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    });
  }

  if (result.length !== nodes.length) {
    throw new Error("Cycle detected in workflow");
  }

  return result;
};

module.exports = { topologicalSort };
