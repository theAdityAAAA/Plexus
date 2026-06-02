import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { useNodeStore } from "../store/nodeStore";

export default function Toolbox() {
  const addNewNode = useWorkflowStore(state => state.addNewNode);
  const setNodes = useWorkflowStore(state => state.setNodes);
  const setEdges = useWorkflowStore(state => state.setEdges);
  const customNodes = useNodeStore(state => state.customNodes);
  const setWizardOpen = useNodeStore(state => state.setWizardOpen);
  const [searchTerm, setSearchTerm] = useState("");

  const builtInNodes = [
    { type: "webhook-trigger", label: "🌐 Webhook Trigger", category: "Core" },
    { type: "payment-check", label: "💳 Payment", category: "Core" },
    { type: "db-update", label: "🗄 DB Update", category: "Core" },
    { type: "email-send", label: "📧 Email", category: "Core" },
    { type: "condition", label: "🔀 Condition", category: "Logic" }
  ];

  const allNodes = [
    ...builtInNodes,
    ...customNodes.map(n => ({
      type: n.type,
      label: `${n.icon || '📦'} ${n.name}`,
      category: n.category || "Custom",
      isCustom: true
    }))
  ].filter(n => n.label.toLowerCase().includes(searchTerm.toLowerCase()));

  const categories = [...new Set(allNodes.map(n => n.category))];

  return (
    <div
      className="position-absolute p-3 d-flex flex-column"
      style={{
        top: 80,
        left: 20,
        background: "#1e293b",
        borderRadius: 12,
        zIndex: 10,
        width: 280,
        height: "calc(100vh - 100px)",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
      }}
    >
      <h5 className="text-white mb-3 text-center border-bottom border-secondary pb-2">🛠 Toolbox</h5>
      
      <input 
        type="text" 
        className="form-control form-control-sm mb-3 bg-dark text-white border-secondary" 
        placeholder="Search nodes..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="flex-grow-1 overflow-auto pe-2 custom-scrollbar">
        {categories.map(cat => (
          <div key={cat} className="mb-3">
            <h6 className="text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>{cat}</h6>
            {allNodes.filter(n => n.category === cat).map(node => (
              <div key={node.type} className="d-flex mb-2 gap-2">
                <button
                  className={`btn btn-sm w-100 text-start px-3 py-2 ${node.isCustom ? 'btn-outline-primary' : 'btn-outline-light'}`}
                  style={{ 
                    borderRadius: '8px', 
                    transition: 'all 0.2s',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => addNewNode(node.type, { name: node.label.replace(/[^a-zA-Z ]/g, "").trim() })}
                >
                  {node.label}
                </button>
                {node.isCustom && (
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    style={{ borderRadius: '8px' }}
                    title="Export Node"
                    onClick={() => {
                      const fullNode = customNodes.find(n => n.type === node.type);
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullNode, null, 2));
                      const downloadAnchorNode = document.createElement('a');
                      downloadAnchorNode.setAttribute("href", dataStr);
                      downloadAnchorNode.setAttribute("download", `${fullNode.name.replace(/\s+/g, '')}.nexusnode`);
                      document.body.appendChild(downloadAnchorNode);
                      downloadAnchorNode.click();
                      downloadAnchorNode.remove();
                    }}
                  >
                    💾
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-top border-secondary">
        <button
          className="btn btn-primary btn-sm w-100 mb-2 py-2"
          style={{ borderRadius: '8px', fontWeight: 'bold' }}
          onClick={() => setWizardOpen(true)}
        >
          ✨ Create Custom Node
        </button>
        
        {/* IMPORT NODE */}
        <label className="btn btn-outline-info btn-sm w-100 mb-2 py-2" style={{ borderRadius: '8px' }}>
          📂 Import Node (.nexusnode)
          <input
            type="file"
            accept=".nexusnode"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async (event) => {
                try {
                  const nodeData = JSON.parse(event.target.result);
                  const success = await useNodeStore.getState().createCustomNode(nodeData);
                  if (success) alert("Node Imported Successfully!");
                } catch (err) {
                  alert("Invalid node file");
                }
              };
              reader.readAsText(file);
            }}
          />
        </label>

        <button
          className="btn btn-outline-danger btn-sm w-100 py-2"
          style={{ borderRadius: '8px' }}
          onClick={() => {
            setNodes([]);
            setEdges([]);
          }}
        >
          🗑 Clear Canvas
        </button>
      </div>
    </div>
  );
}
