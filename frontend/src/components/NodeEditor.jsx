import React from "react";
import { useWorkflowStore } from "../store/workflowStore";
import MonacoCodeEditor from "./MonacoCodeEditor";
import { nodeSchemas, nodeDefaultCode } from "../config/nodeSchemas";

export default function NodeEditor() {
  const selectedNode = useWorkflowStore((state) => state.selectedNode);
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData);

  if (!selectedNode) return null;

  const handleConfigChange = (key, value) => {
    updateNodeData(selectedNode.id, (oldData) => ({
      config: { ...oldData.config, [key]: value }
    }));
  };

  const handleCodeChange = (code) => {
    updateNodeData(selectedNode.id, () => ({ userCode: code }));
  };

  return (
    <div
      className="position-absolute p-4 d-flex flex-column"
      style={{
        top: 10,
        right: 20,
        bottom: 20,
        background: "#1e293b",
        borderRadius: 12,
        zIndex: 10,
        width: 400,
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        overflowY: "auto"
      }}
    >
      <h5 className="text-white mb-4 border-bottom border-secondary pb-2">
        ⚙️ Node Configuration
      </h5>

      {/* Node Info */}
      <div className="mb-4 bg-dark p-3 rounded border border-secondary">
        <div className="text-muted small">NODE ID</div>
        <div className="text-white text-truncate font-monospace">{selectedNode.id}</div>
        <div className="text-muted small mt-2">TYPE</div>
        <div className="text-info">{selectedNode.data.type}</div>
      </div>

      {/* Basic Config */}
      <div className="mb-4">
        <h6 className="text-white mb-3">Settings</h6>
        <div className="mb-3">
          <label className="text-muted small">Node Label</label>
          <input
            type="text"
            className="form-control bg-dark text-white border-secondary"
            value={selectedNode.data.label || ""}
            onChange={(e) => updateNodeData(selectedNode.id, () => ({ label: e.target.value }))}
          />
        </div>
        
        {(nodeSchemas[selectedNode.data.type] || []).map((field) => (
          <div key={field.key} className="mb-3">
            <label className="text-muted small">{field.label}</label>
            {field.type === "select" ? (
              <select
                className="form-select bg-dark text-white border-secondary"
                value={selectedNode.data.config?.[field.key] ?? field.default}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
              >
                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : field.type === "checkbox" ? (
              <div className="form-check mt-1">
                <input
                  type="checkbox"
                  className="form-check-input border-secondary"
                  checked={selectedNode.data.config?.[field.key] ?? field.default}
                  onChange={(e) => handleConfigChange(field.key, e.target.checked)}
                />
              </div>
            ) : (
              <input
                type={field.type}
                className="form-control bg-dark text-white border-secondary"
                value={selectedNode.data.config?.[field.key] ?? field.default}
                onChange={(e) => handleConfigChange(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {/* User Hook Code */}
      <div className="mb-4 flex-grow-1 d-flex flex-column">
        <h6 className="text-white mb-2">User Hook Code</h6>
        <p className="text-white-50 small mb-3">
          Write custom logic to modify outputs or interact with context. Must implement <code>execute(input, context)</code>.
        </p>
        <div className="flex-grow-1 min-vh-25">
          <MonacoCodeEditor
            code={selectedNode.data.userCode || nodeDefaultCode[selectedNode.data.type] || nodeDefaultCode["default"]}
            onChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
}
