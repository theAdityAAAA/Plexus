
import React, { useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import { io } from "socket.io-client";

import { useWorkflowStore } from "./store/workflowStore";
import { useNodeStore } from "./store/nodeStore";

import Toolbox from "./components/Toolbox";
import NodeEditor from "./components/NodeEditor";
import CustomNodeWizard from "./components/CustomNodeWizard";
import CustomNode from "./components/CustomNode";
import CustomEdge from "./components/CustomEdge";

const nodeTypes = {
  default: CustomNode,
  custom: CustomNode, // fallback if custom type used
};

const edgeTypes = {
  default: CustomEdge,
};

const socket = io("http://localhost:5005");

function App() {
  const {
    nodes, edges, workflowId, workflowList,
    onNodesChange, onEdgesChange, onConnect, onEdgeUpdate,
    setNodes, setEdges, setSelectedNode,
    fetchWorkflows, loadWorkflow, saveWorkflow, runWorkflow
  } = useWorkflowStore();

  const fetchCustomNodes = useNodeStore(state => state.fetchCustomNodes);

  const updateNodeStatus = useWorkflowStore(state => state.updateNodeStatus);

  // Initial Fetch
  // Initial Fetch
useEffect(() => {
  fetchWorkflows();
  fetchCustomNodes();
}, [fetchWorkflows, fetchCustomNodes]);

// Socket Connection Check
useEffect(() => {
  socket.on("connect", () => {
    console.log("SOCKET CONNECTED", socket.id);
  });

  return () => {
    socket.off("connect");
  };
}, []);

// Socket Listener for Node Status
useEffect(() => {
  socket.on(
    "node-status",
    ({
      node,
      status,
      output,
      error,
      duration
    }) => {
      console.log("SOCKET EVENT", {
        node,
        status,
        output,
        error,
        duration
      });

      updateNodeStatus(
        node,
        status,
        output,
        error,
        duration
      );
    }
  );

  return () => socket.off("node-status");
}, [updateNodeStatus]);

  return (
    <div style={{ height: "100vh", background: "#0f172a", overflow: "hidden" }}>
      {/* NAVBAR */}
      <nav className="navbar navbar-dark bg-dark px-4 border-bottom border-secondary" style={{ height: 60 }}>
        <span className="navbar-brand h4 mb-0">
          🚀 NexusFlow Automation Engine <span className="badge bg-primary ms-2 fs-6">Pro</span>
        </span>
        <div className="d-flex align-items-center gap-3">
          <select
            className="form-select bg-dark text-white border-secondary"
            style={{ width: 250 }}
            value={workflowId || ""}
            onChange={(e) => loadWorkflow(e.target.value)}
          >
            <option value="">Select Workflow</option>
            {workflowList.map((wf) => (
              <option key={wf._id} value={wf._id}>
                {wf.name} - {wf._id.slice(-4)}
              </option>
            ))}
          </select>

          <button onClick={saveWorkflow} className="btn btn-success d-flex align-items-center gap-2">
            💾 Save
          </button>
          <button onClick={runWorkflow} className="btn btn-primary d-flex align-items-center gap-2">
            ▶ Run
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div style={{ position: "relative", width: "100%", height: "calc(100vh - 60px)" }}>
        <Toolbox />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeUpdate={onEdgeUpdate}
          onConnect={(params) => {
            const sourceNode = nodes.find(n => n.id === params.source);
            let branch = null;
            if (sourceNode?.data?.type === "condition") {
              branch = window.prompt("Enter branch label (True / False)");
            }
            onConnect(params, branch);
          }}
          onNodeClick={(_, node) => setSelectedNode(node)}
          onPaneClick={() => setSelectedNode(null)}
          defaultEdgeOptions={{ style: { strokeWidth: 3, stroke: '#94a3b8' }, updatable: true }}
          fitView
        >
          <MiniMap nodeStrokeColor="#0f172a" nodeColor="#334155" maskColor="rgba(0,0,0,0.2)" />
          <Controls />
          <Background gap={16} size={1} color="#334155" />
        </ReactFlow>

        <NodeEditor />
      </div>

      <CustomNodeWizard />
    </div>
  );
}

export default App;