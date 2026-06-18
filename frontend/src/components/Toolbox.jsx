import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import { useNodeStore } from "../store/nodeStore";

export default function Toolbox() {
  const addNewNode = useWorkflowStore(state => state.addNewNode);
  const setNodes = useWorkflowStore(state => state.setNodes);
  const setEdges = useWorkflowStore(state => state.setEdges);
  const customNodes = useNodeStore(state => state.customNodes);
  const deleteCustomNode = useNodeStore(state => state.deleteCustomNode);
  const setWizardOpen = useNodeStore(state => state.setWizardOpen);
  const [searchTerm, setSearchTerm] = useState("");

  const builtInNodes = [
    // Core
    { type: "webhook-trigger", label: "🌐 Webhook Trigger", category: "Core" },
    { type: "payment-check", label: "💳 Payment", category: "Core" },
    { type: "email-send", label: "📧 Email", category: "Core" },
    { type: "condition", label: "🔀 Condition", category: "Core" },

    // TRIGGERS
    { type: "http-request", label: "🌍 HTTP Request", category: "Triggers" },
    { type: "schedule", label: "⏱ Schedule/Cron", category: "Triggers" },
    { type: "event-listener", label: "📡 Event Listener", category: "Triggers" },

    // DATABASE & STORAGE
    // { type: "db-query", label: "🔍 DB Query/Read", category: "Database" },
    // { type: "db-insert", label: "➕ DB Insert/Create", category: "Database" },
    // { type: "db-update", label: "✏️ DB Update", category: "Database" },
    // { type: "db-delete", label: "🗑 DB Delete", category: "Database" },
    { type: "mongo-find", label: "Mongo Find", category: "Database" },
    { type: "mongo-insert", label: "Mongo Insert", category: "Database" },
    { type: "mongo-update", label: "Mongo Update", category: "Database" },
    { type: "mongo-delete", label: "Mongo Delete", category: "Database" },
    { type: "file-operations", label: "📁 File Operations", category: "Database" },

    // CONTROL FLOW
    { type: "loop", label: "🔄 Loop/Iterator", category: "Control Flow" },
    { type: "switch", label: "🛤 Switch/Router", category: "Control Flow" },
    { type: "delay", label: "⏳ Delay", category: "Control Flow" },
    { type: "error-catch", label: "⚠️ Error Catch", category: "Control Flow" },
    { type: "merge", label: "🔗 Merge", category: "Control Flow" },

    // DATA INTEGRATION
    { type: "external-api-call", label: "🔗 External API Call", category: "Data Integration" },
    { type: "data-transformer", label: "🛠 Data Transformer", category: "Data Integration" },
    { type: "custom-script", label: "📜 Custom Script", category: "Data Integration" },

    // AI & ML
    { type: "llm-prompt", label: "🤖 LLM Prompt", category: "AI & ML" },
    { type: "model-inference", label: "🧠 Model Inference", category: "AI & ML" },
    { type: "text-processing", label: "📝 Text Processing", category: "AI & ML" }
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
        top: 10,
        left: 20,
        bottom: 20,
        background: "#1e293b",
        borderRadius: 12,
        zIndex: 10,
        width: 280,
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

      <div className="flex-grow-1 overflow-auto pe-2 custom-scrollbar" style={{ minHeight: 0 }}>
        {categories.map(cat => (
          <div key={cat} className="mb-3">
            <h6 className="text-uppercase mb-2" style={{ color: '#94a3b8', fontSize: '0.75rem', letterSpacing: '1px', fontWeight: 600 }}>{cat}</h6>
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
                  <>
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
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      style={{ borderRadius: '8px' }}
                      title="Delete Node"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this custom node?")) {
                          const fullNode = customNodes.find(n => n.type === node.type);
                          if (fullNode && fullNode._id) {
                            deleteCustomNode(fullNode._id);
                          }
                        }
                      }}
                    >
                      🗑
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-top border-secondary flex-shrink-0">
        <button
          className="btn btn-primary btn-sm w-100 mb-2 py-2"
          style={{ borderRadius: '8px', fontWeight: 'bold' }}
          onClick={() => setWizardOpen(true)}
        >
          ✨ Create Custom Node
        </button>
        
        <div className="d-flex gap-2">
          {/* IMPORT NODE */}
          <label className="btn btn-outline-info btn-sm w-50 mb-0 py-2 d-flex align-items-center justify-content-center" style={{ borderRadius: '8px', cursor: 'pointer' }}>
            <span className="text-truncate">📂 Import</span>
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

          {/* CLEAR CANVAS */}
          <button
            className="btn btn-outline-danger btn-sm w-50 py-2 d-flex align-items-center justify-content-center"
            style={{ borderRadius: '8px' }}
            onClick={() => {
              setNodes([]);
              setEdges([]);
            }}
          >
            <span className="text-truncate">🗑 Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}
