import React from "react";
import { Handle, Position } from "reactflow";
import { useWorkflowStore } from "../store/workflowStore";

export default function CustomNode({ id, data, isConnectable, selected }) {
  const deleteNode = useWorkflowStore(state => state.deleteNode);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        ...data.style
      }}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(id);
        }}
        style={{
          position: "absolute",
          top: "-10px",
          right: "-10px",
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "20px",
          height: "20px",
          fontSize: "12px",
          fontWeight: "bold",
          lineHeight: "1",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          zIndex: 10
        }}
        title="Delete Node"
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        ✕
      </button>

      <div><strong>{data.label || data.type}</strong></div>
      {data.type && <div style={{ fontSize: "10px", opacity: 0.8 }}>{data.type}</div>}

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}
