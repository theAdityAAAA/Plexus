
import React, { useEffect, useState } from "react";
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
import VariableExplorer from "./components/VariableExplorer";
import ExecutionHistoryPage from "./components/ExecutionHistoryPage";
import ExecutionDetailsPage from "./components/ExecutionDetailsPage";
import GraphValidationPanel from "./components/GraphValidationPanel";

const nodeTypes = {
  default: CustomNode,
  custom: CustomNode, // fallback if custom type used
};

const edgeTypes = {
  default: CustomEdge,
};

const socket = io("http://localhost:5005");

function App() {
  const [activeView, setActiveView] = useState("builder");
  const [selectedExecutionId, setSelectedExecutionId] = useState(null);

  const {
    nodes, edges, workflowId,  workflowName, workflowList,
    createWorkflow,saveAsNewWorkflow,
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
       <nav
  className="navbar navbar-dark bg-dark px-4 border-bottom border-secondary"
  style={{ height: 60 }}
>
  <span className="navbar-brand h4 mb-0">
    🚀ＰＬＥＸＵＳ
    <span className="badge bg-primary ms-2 fs-6">
      BUILD YOUR BACKEND WITH US IN SECONDS
    </span>
  </span>

  <div className="d-flex align-items-center gap-3">
    <div className="btn-group" role="group" aria-label="Primary navigation">
      <button
        type="button"
        className={`btn btn-sm ${activeView === "builder" ? "btn-primary" : "btn-outline-light"}`}
        onClick={() => setActiveView("builder")}
      >
        Builder
      </button>
      <button
        type="button"
        className={`btn btn-sm ${activeView !== "builder" ? "btn-primary" : "btn-outline-light"}`}
        onClick={() => {
          setSelectedExecutionId(null);
          setActiveView("executions");
        }}
      >
        Executions
      </button>
    </div>

    {activeView === "builder" && (
      <>
    <button
      className="btn btn-success"
      onClick={() => {
        const name = prompt(
          "Enter Workflow Name"
        );

        if (!name) return;

        createWorkflow(name);
      }}
    >
      ➕ Create Workflow
    </button>

    <select
      className="form-select bg-dark text-white border-secondary"
      style={{ width: 250 }}
      value={workflowId || ""}
      onChange={(e) =>
        loadWorkflow(e.target.value)
      }
    >
      <option value="">
        Existing Workflows
      </option>

      {workflowList.map((wf) => (
        <option
          key={wf._id}
          value={wf._id}
        >
          {wf.name}
        </option>
      ))}
    </select>

    <button
      onClick={saveWorkflow}
      className="btn btn-success d-flex align-items-center gap-2"
    >
      💾 Save
    </button>

    <button
      onClick={saveAsNewWorkflow}
      className="btn btn-warning d-flex align-items-center gap-2"
    >
      📋 Save As New
    </button>

    <button
      onClick={runWorkflow}
      className="btn btn-primary d-flex align-items-center gap-2"
    >
      ▶ Run
    </button>
      </>
    )}

  </div>
</nav>
      {activeView === "executions" && !selectedExecutionId && (
        <ExecutionHistoryPage
          onOpenExecution={(executionId) => {
            setSelectedExecutionId(executionId);
          }}
        />
      )}

      {activeView === "executions" && selectedExecutionId && (
        <ExecutionDetailsPage
          executionId={selectedExecutionId}
          onBack={() => setSelectedExecutionId(null)}
        />
      )}

      {activeView === "builder" && (
        <div style={{ position: "relative", width: "100%", height: "calc(100vh - 60px)" }}>
        <Toolbox />
        <GraphValidationPanel />
        <VariableExplorer
          title="Variable Explorer"
          style={{
            position: "absolute",
            top: 10,
            left: 320,
            bottom: 20,
            zIndex: 9
          }}
        />
        
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
      )}

      <CustomNodeWizard />
    </div>
  );
}

export default App;
