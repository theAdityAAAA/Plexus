// import React, { useEffect } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";
// import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
// import "reactflow/dist/style.css";
// import { io } from "socket.io-client";

// import { useWorkflowStore } from "./store/workflowStore";
// import { useNodeStore } from "./store/nodeStore";

// const socket = io("http://localhost:5005");

// function App() {
//   const [
//     nodes,
//     edges,
//     workflowId,
//     workflowList,
//     selectedEdge,
//     addNewNode,
//     onNodesChange,
//     onEdgesChange,
//     onConnect,
//     setSelectedEdge,
//     setNodes,
//     setEdges,
//     fetchWorkflows,
//     loadWorkflow,
//     updateNodeStatus,
//     saveWorkflow,
//     runWorkflow
//   ] = useWorkflowStore((state) => [
//     state.nodes,
//     state.edges,
//     state.workflowId,
//     state.workflowList,
//     state.selectedEdge,
//     state.addNewNode,
//     state.onNodesChange,
//     state.onEdgesChange,
//     state.onConnect,
//     state.setSelectedEdge,
//     state.setNodes,
//     state.setEdges,
//     state.fetchWorkflows,
//     state.loadWorkflow,
//     state.updateNodeStatus,
//     state.saveWorkflow,
//     state.runWorkflow
//   ]);

//   const fetchCustomNodes = useNodeStore((state) => state.fetchCustomNodes);

//   /* =========================
//      DEBUG STATE LOGS
//   ========================== */
//   useEffect(() => {
//     console.log("Nodes:", nodes);
//     console.log("Edges:", edges);
//   }, [nodes, edges]);

//   /* =========================
//      ADD NODE
//   ========================== */
//   // const addNewNode = (type) => {
//   //   const newNode = {
//   //     id: `${type}-${Date.now()}`,
//   //     position: {
//   //       x: Math.random() * 500 + 100,
//   //       y: Math.random() * 400 + 100
//   //     },
//   //     data: { label: type, type }
//   //   };

//   //   setNodes((nds) => [...nds, newNode]);
//   // };

//   /* =========================
//      INSERT NODE BETWEEN
//   ========================== */
//   const insertNodeBetween = (type) => {
//     if (!selectedEdge) {
//       alert("Click an edge first 🔁");
//       return;
//     }

//     const { source, target, data } = selectedEdge;

//     const sourceNode = nodes.find((n) => n.id === source);
//     const targetNode = nodes.find((n) => n.id === target);

//     const newNodeId = `${type}-${Date.now()}`;

//     const newNode = {
//       id: newNodeId,
//       position: {
//         x: (sourceNode.position.x + targetNode.position.x) / 2,
//         y: (sourceNode.position.y + targetNode.position.y) / 2
//       },
//       data: { label: type, type }
//     };

//     setNodes((nds) => [...nds, newNode]);

//     setEdges((eds) => {
//       // Remove original edge safely
//       const filtered = eds.filter(
//         (e) => !(e.source === source && e.target === target)
//       );

//       return [
//         ...filtered,
//         {
//           id: `e-${source}-${newNodeId}`,
//           source,
//           target: newNodeId
//         },
//         {
//           id: `e-${newNodeId}-${target}`,
//           source: newNodeId,
//           target,
//           data: data || null,
//           label: data?.branch || null
//         }
//       ];
//     });

//     setSelectedEdge(null);
//     alert("Node inserted between successfully 🔁");
//   };

//   /* =========================
//      FETCH WORKFLOWS
//   ========================== */
//   useEffect(() => {
//     fetchWorkflows();
//     fetchCustomNodes();
//   }, [fetchWorkflows, fetchCustomNodes]);

//   // Socket Listener for Node Status
//   useEffect(() => {
//     socket.on("node-status", ({ node, status }) => {
//       updateNodeStatus(node, status);
//     });
//     return () => socket.off("node-status");
//   }, [updateNodeStatus]);

//   return (
//     <div style={{ height: "100vh", background: "#0f172a", overflow: "hidden" }}>
//       {/* NAVBAR */}
//       <nav className="navbar navbar-dark bg-dark px-4 border-bottom border-secondary" style={{ height: 60 }}>
//         <span className="navbar-brand h4 mb-0">
//           🚀 NexusFlow Automation Engine <span className="badge bg-primary ms-2 fs-6">Pro</span>
//         </span>
//         <div className="d-flex align-items-center gap-3">
//           <select
//             className="form-select bg-dark text-white border-secondary"
//             style={{ width: 250 }}
//             value={workflowId || ""}
//             onChange={(e) => loadWorkflow(e.target.value)}
//           >
//             <option value="">Select Workflow</option>
//             {workflowList.map((wf) => (
//               <option key={wf._id} value={wf._id}>
//                 {wf.name} - {wf._id.slice(-4)}
//               </option>
//             ))}
//           </select>

//           <button onClick={saveWorkflow} className="btn btn-success d-flex align-items-center gap-2">
//             💾 Save
//           </button>
//           <button onClick={runWorkflow} className="btn btn-primary d-flex align-items-center gap-2">
//             ▶ Run
//           </button>
//         </div>
//       </nav>

//       {/* TOOLBOX */}
//       {/* TOOLBOX */}
// <div
//   className="position-absolute p-3"
//   style={{
//     top: 100,
//     left: 20,
//     background: "#1e293b",
//     borderRadius: 12,
//     zIndex: 10,
//     width: 250
//   }}
// >
//   <h6 className="text-white">Toolbox</h6>

//   {/* WEBHOOK TRIGGER */}
//   <button
//     className="btn btn-outline-danger btn-sm mb-2 w-100"
//     onClick={() => addNewNode("webhook-trigger")}
//   >
//     🌐 Webhook Trigger
//   </button>

//   {/* PAYMENT */}
//   <button
//     className="btn btn-outline-light btn-sm mb-2 w-100"
//     onClick={() => addNewNode("payment-check")}
//   >
//     💳 Payment
//   </button>

//   {/* DB UPDATE */}
//   <button
//     className="btn btn-outline-info btn-sm mb-2 w-100"
//     onClick={() => addNewNode("db-update")}
//   >
//     🗄 DB Update
//   </button>

//   {/* EMAIL */}
//   <button
//     className="btn btn-outline-warning btn-sm mb-2 w-100"
//     onClick={() => addNewNode("email-send")}
//   >
//     📧 Email
//   </button>

//   {/* CONDITION */}
//   <button
//     className="btn btn-outline-secondary btn-sm mb-2 w-100"
//     onClick={() => addNewNode("condition")}
//   >
//     🔀 Condition
//   </button>

//   {/* INSERT BETWEEN */}
//   {selectedEdge && (
//     <>
//       <hr className="text-white" />

//       <button
//         className="btn btn-outline-light btn-sm mb-2 w-100"
//         onClick={() =>
//           insertNodeBetween("db-update")
//         }
//       >
//         Insert DB Between
//       </button>

//       <button
//         className="btn btn-outline-light btn-sm mb-2 w-100"
//         onClick={() =>
//           insertNodeBetween("email-send")
//         }
//       >
//         Insert Email Between
//       </button>

//       <button
//         className="btn btn-outline-light btn-sm w-100"
//         onClick={() =>
//           insertNodeBetween(
//             "webhook-trigger"
//           )
//         }
//       >
//         Insert Webhook Between
//       </button>
//     </>
//   )}

//   {/* CLEAR */}
//   <button
//     className="btn btn-outline-danger btn-sm mt-3 w-100"
//     onClick={() => {
//       setNodes([]);
//       setEdges([]);
//     }}
//   >
//     🗑 Clear
//   </button>
// </div>
//      {/* <div
//         className="position-absolute p-3"
//         style={{
//           top: 100,
//           left: 20,
//           background: "#1e293b",
//           borderRadius: 12,
//           zIndex: 10
//         }}
//       >
//         <h6 className="text-white">Toolbox</h6>

//         <button
//           className="btn btn-outline-light btn-sm mb-2 w-100"
//           onClick={() => addNewNode("payment-check")}
//         >
//           💳 Payment
//         </button>

//         <button
//           className="btn btn-outline-info btn-sm mb-2 w-100"
//           onClick={() => addNewNode("db-update")}
//         >
//           🗄 DB Update
//         </button>

//         <button
//           className="btn btn-outline-warning btn-sm mb-2 w-100"
//           onClick={() => addNewNode("email-send")}
//         >
//           📧 Email
//         </button>

//         <button
//           className="btn btn-outline-secondary btn-sm mb-2 w-100"
//           onClick={() => addNewNode("condition")}
//         >
//           🔀 Condition
//         </button>

//         {selectedEdge && (
//           <>
//             <hr className="text-white" />
//             <button
//               className="btn btn-outline-light btn-sm mb-2 w-100"
//               onClick={() => insertNodeBetween("db-update")}
//             >
//               Insert DB Between
//             </button>

//             <button
//               className="btn btn-outline-light btn-sm w-100"
//               onClick={() => insertNodeBetween("email-send")}
//             >
//               Insert Email Between
//             </button>
//           </>
//         )}

//         <button
//           className="btn btn-outline-danger btn-sm mt-3 w-100"
//           onClick={() => {
//             setNodes([]);
//             setEdges([]);
//           }}
//         >
//           🗑 Clear
//         </button>
//       </div> */}

//       {/* WORKFLOW SELECT */}
//       <div className="position-absolute top-0 start-50 translate-middle-x mt-3">
//         <select
//           className="form-select"
//           style={{ width: 250 }}
//           value={workflowId || ""}
//           onChange={(e) => loadWorkflow(e.target.value)}
//         >
//           <option value="">Select Workflow</option>
//           {workflowList.map((wf) => (
//             <option key={wf._id} value={wf._id}>
//               {wf.name} - {wf._id.slice(-4)}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* REACT FLOW */}
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         defaultEdgeOptions={{
//           style: { strokeWidth: 3 }
//         }}
//         onConnect={(params) => {
//           const sourceNode = nodes.find((n) => n.id === params.source);
//           let branch = null;

//           if (sourceNode?.data?.type === "condition") {
//             branch = window.prompt("Enter branch label (success / failure)");
//           }

//           onConnect(params, branch);
//         }}
//         onEdgeClick={(event, edge) => {
//           event.stopPropagation();
//           setSelectedEdge(edge);
//         }}
//       >
//         <MiniMap />
//         <Controls />
//         <Background gap={16} size={1} color="#334155" />
//       </ReactFlow>
//     </div>
//   );
// }

// export default App;
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

const socket = io("http://localhost:5005");

function App() {
  const {
    nodes, edges, workflowId, workflowList,
    onNodesChange, onEdgesChange, onConnect,
    setNodes, setEdges, setSelectedNode,
    fetchWorkflows, loadWorkflow, saveWorkflow, runWorkflow
  } = useWorkflowStore();

  const fetchCustomNodes = useNodeStore(state => state.fetchCustomNodes);

  const updateNodeStatus = useWorkflowStore(state => state.updateNodeStatus);

  // Initial Fetch
  useEffect(() => {
    fetchWorkflows();
    fetchCustomNodes();
  }, [fetchWorkflows, fetchCustomNodes]);

  // Socket Listener for Node Status
  useEffect(() => {
    socket.on("node-status", ({ node, status }) => {
      updateNodeStatus(node, status);
    });
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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
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
          defaultEdgeOptions={{ style: { strokeWidth: 3, stroke: '#94a3b8' } }}
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