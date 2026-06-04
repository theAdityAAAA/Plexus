import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  applyEdgeChanges
} from "reactflow";
import "reactflow/dist/style.css";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5005");

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [workflowId, setWorkflowId] = useState(null);
  const [workflowList, setWorkflowList] = useState([]);
  const [selectedEdge, setSelectedEdge] = useState(null);

  /* =========================
     DEBUG STATE LOGS
  ========================== */
  useEffect(() => {
    console.log("Nodes:", nodes);
    console.log("Edges:", edges);
  }, [nodes, edges]);

  /* =========================
     ADD NODE
  ========================== */
  const addNewNode = (type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      position: {
        x: Math.random() * 500 + 100,
        y: Math.random() * 400 + 100
      },
      data: { label: type, type }
    };

    setNodes((nds) => [...nds, newNode]);
  };

  /* =========================
     INSERT NODE BETWEEN
  ========================== */
  const insertNodeBetween = (type) => {
    if (!selectedEdge) {
      alert("Click an edge first 🔁");
      return;
    }

    const { source, target, data } = selectedEdge;

    const sourceNode = nodes.find((n) => n.id === source);
    const targetNode = nodes.find((n) => n.id === target);

    const newNodeId = `${type}-${Date.now()}`;

    const newNode = {
      id: newNodeId,
      position: {
        x: (sourceNode.position.x + targetNode.position.x) / 2,
        y: (sourceNode.position.y + targetNode.position.y) / 2
      },
      data: { label: type, type }
    };

    setNodes((nds) => [...nds, newNode]);

    setEdges((eds) => {
      // Remove original edge safely
      const filtered = eds.filter(
        (e) => !(e.source === source && e.target === target)
      );

      return [
        ...filtered,
        {
          id: `e-${source}-${newNodeId}`,
          source,
          target: newNodeId
        },
        {
          id: `e-${newNodeId}-${target}`,
          source: newNodeId,
          target,
          data: data || null,
          label: data?.branch || null
        }
      ];
    });

    setSelectedEdge(null);
    alert("Node inserted between successfully 🔁");
  };

  /* =========================
     SAVE WORKFLOW
  ========================== */
  const saveWorkflow = async () => {
    try {
      const workflow = {
        name: "Dynamic Workflow",
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          config: node.data.config || {}
        })),
        edges: edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          data: {
            branch: edge.data?.branch || null
          }
        }))
      };

      console.log("Saving workflow:", workflow);

      const res = await axios.post(
        "http://localhost:5005/api/workflows",
        workflow
      );

      setWorkflowId(res.data.data._id);
      alert("Workflow Saved 🚀");
    } catch (error) {
      console.error(error);
      alert("Save failed");
    }
  };

  /* =========================
     RUN WORKFLOW
  ========================== */
  const runWorkflow = async () => {
    if (!workflowId) {
      alert("Save workflow first!");
      return;
    }

    await axios.post(
      `http://localhost:5005/api/workflows/${workflowId}/execute`
    );
  };

  /* =========================
     FETCH WORKFLOWS
  ========================== */
  useEffect(() => {
    const fetchWorkflows = async () => {
      const res = await axios.get(
        "http://localhost:5005/api/workflows"
      );
      setWorkflowList(res.data.data);
    };

    fetchWorkflows();
  }, []);

  /* =========================
     SOCKET STATUS
  ========================== */
  useEffect(() => {
    socket.on("node-status", ({ node, status }) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === node
            ? {
                ...n,
                style: {
                  background:
                    status === "completed"
                      ? "#28a745"
                      : status === "failed"
                      ? "#dc3545"
                      : "#ffc107",
                  color: "white"
                }
              }
            : n
        )
      );
    });

    return () => socket.off("node-status");
  }, [setNodes]);

  return (
    <div style={{ height: "100vh", background: "#0f172a" }}>
      <nav className="navbar navbar-dark bg-dark px-4">
        <span className="navbar-brand h4">
          🚀 NexusFlow Automation Engine
        </span>
        <div>
          <button onClick={saveWorkflow} className="btn btn-success me-2">
            💾 Save
          </button>
          <button onClick={runWorkflow} className="btn btn-primary">
            ▶ Run
          </button>
        </div>
      </nav>

      {/* TOOLBOX */}
      {/* TOOLBOX */}
<div
  className="position-absolute p-3"
  style={{
    top: 100,
    left: 20,
    background: "#1e293b",
    borderRadius: 12,
    zIndex: 10,
    width: 250
  }}
>
  <h6 className="text-white">Toolbox</h6>

  {/* WEBHOOK TRIGGER */}
  <button
    className="btn btn-outline-danger btn-sm mb-2 w-100"
    onClick={() => addNewNode("webhook-trigger")}
  >
    🌐 Webhook Trigger
  </button>

  {/* PAYMENT */}
  <button
    className="btn btn-outline-light btn-sm mb-2 w-100"
    onClick={() => addNewNode("payment-check")}
  >
    💳 Payment
  </button>

  {/* DB UPDATE */}
  <button
    className="btn btn-outline-info btn-sm mb-2 w-100"
    onClick={() => addNewNode("db-update")}
  >
    🗄 DB Update
  </button>

  {/* EMAIL */}
  <button
    className="btn btn-outline-warning btn-sm mb-2 w-100"
    onClick={() => addNewNode("email-send")}
  >
    📧 Email
  </button>

  {/* CONDITION */}
  <button
    className="btn btn-outline-secondary btn-sm mb-2 w-100"
    onClick={() => addNewNode("condition")}
  >
    🔀 Condition
  </button>

  {/* INSERT BETWEEN */}
  {selectedEdge && (
    <>    
      <hr className="text-white" />

      <button
        className="btn btn-outline-light btn-sm mb-2 w-100"
        onClick={() =>
          insertNodeBetween("db-update")
        }
      >
        Insert DB Between
      </button>

      <button
        className="btn btn-outline-light btn-sm mb-2 w-100"
        onClick={() =>
          insertNodeBetween("email-send")
        }
      >
        Insert Email Between
      </button>

      <button
        className="btn btn-outline-light btn-sm w-100"
        onClick={() =>
          insertNodeBetween(
            "webhook-trigger"
          )
        }
      >
        Insert Webhook Between
      </button>
    </>
  )}

  {/* CLEAR */}
  <button
    className="btn btn-outline-danger btn-sm mt-3 w-100"
    onClick={() => {
      setNodes([]);
      setEdges([]);
    }}
  >
    🗑 Clear
  </button>
</div>
     {/* <div
        className="position-absolute p-3"
        style={{
          top: 100,
          left: 20,
          background: "#1e293b",
          borderRadius: 12,
          zIndex: 10
        }}
      >
        <h6 className="text-white">Toolbox</h6>

        <button
          className="btn btn-outline-light btn-sm mb-2 w-100"
          onClick={() => addNewNode("payment-check")}
        >
          💳 Payment
        </button>

        <button
          className="btn btn-outline-info btn-sm mb-2 w-100"
          onClick={() => addNewNode("db-update")}
        >
          🗄 DB Update
        </button>

        <button
          className="btn btn-outline-warning btn-sm mb-2 w-100"
          onClick={() => addNewNode("email-send")}
        >
          📧 Email
        </button>

        <button
          className="btn btn-outline-secondary btn-sm mb-2 w-100"
          onClick={() => addNewNode("condition")}
        >
          🔀 Condition
        </button>

        {selectedEdge && (
          <>
            <hr className="text-white" />
            <button
              className="btn btn-outline-light btn-sm mb-2 w-100"
              onClick={() => insertNodeBetween("db-update")}
            >
              Insert DB Between
            </button>

            <button
              className="btn btn-outline-light btn-sm w-100"
              onClick={() => insertNodeBetween("email-send")}
            >
              Insert Email Between
            </button>
          </>
        )}

        <button
          className="btn btn-outline-danger btn-sm mt-3 w-100"
          onClick={() => {
            setNodes([]);
            setEdges([]);
          }}
        >
          🗑 Clear
        </button>
      </div> */}

      {/* WORKFLOW SELECT */}
      <div className="position-absolute top-0 start-50 translate-middle-x mt-3">
        <select
          className="form-select"
          style={{ width: 250 }}
          onChange={(e) => {
            const id = e.target.value;
            const selected = workflowList.find(
              (w) => w._id === id
            );
            if (!selected) return;

            setWorkflowId(id);

            setNodes(
              selected.nodes.map((n) => ({
                id: n.id,
                position: {
                  x: Math.random() * 500,
                  y: Math.random() * 400
                },
                data: { label: n.type, type: n.type }
              }))
            );

            setEdges(
              selected.edges.map((e, i) => ({
                id: `e-${i}`,
                source: e.source,
                target: e.target,
                data: { branch: e.data?.branch || null },
                label: e.data?.branch || null
              }))
            );
          }}
        >
          <option>Select Workflow</option>
          {workflowList.map((wf) => (
            <option key={wf._id} value={wf._id}>
              {wf.name} - {wf._id.slice(-4)}
            </option>
          ))}
        </select>
      </div>

      {/* REACT FLOW */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={(changes) =>
          setEdges((eds) => applyEdgeChanges(changes, eds))
        }
        defaultEdgeOptions={{
          style: { strokeWidth: 3 }
        }}
        onConnect={(params) => {
          const sourceNode = nodes.find(
            (n) => n.id === params.source
          );

          let branch = null;

          if (sourceNode?.data?.type === "condition") {
            branch = window.prompt(
              "Enter branch label (success / failure)"
            );
          }

          setEdges((eds) =>
            addEdge(
              {
                ...params,
                data: { branch },
                label: branch
              },
              eds
            )
          );
        }}
        onEdgeClick={(event, edge) => {
          event.stopPropagation();
          setSelectedEdge(edge);
        }}
      >
        <MiniMap />
        <Controls />
        <Background gap={16} size={1} color="#334155" />
      </ReactFlow>
    </div>
  );
}

export default App;