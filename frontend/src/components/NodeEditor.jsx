import React from "react";
import { useWorkflowStore } from "../store/workflowStore";
import MonacoCodeEditor from "./MonacoCodeEditor";

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
        top: 80,
        right: 20,
        background: "#1e293b",
        borderRadius: 12,
        zIndex: 10,
        width: 400,
        height: "calc(100vh - 100px)",
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
        
        {selectedNode.data.type === "email-send" && (
          <>
            <div className="mb-3">
              <label className="text-muted small">To Email (Optional Override)</label>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                value={selectedNode.data.config?.to || ""}
                onChange={(e) => handleConfigChange("to", e.target.value)}
              />
            </div>
            <div className="mb-3">
              <label className="text-muted small">Subject</label>
              <input
                type="text"
                className="form-control bg-dark text-white border-secondary"
                value={selectedNode.data.config?.subject || ""}
                onChange={(e) => handleConfigChange("subject", e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {/* User Hook Code */}
      <div className="mb-4 flex-grow-1 d-flex flex-column">
        <h6 className="text-white mb-2">User Hook Code</h6>
        <p className="text-muted small mb-3">
          Write custom logic to modify outputs or interact with context. Must implement <code>execute(input, context)</code>.
        </p>
        <div className="flex-grow-1 min-vh-25">
          <MonacoCodeEditor
            code={selectedNode.data.userCode || `function execute(input, context) {\n  return {\n    ...input,\n    processedAt: new Date().toISOString()\n  };\n}`}
            onChange={handleCodeChange}
          />
        </div>
      </div>
    </div>
  );
}
