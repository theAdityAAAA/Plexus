import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { useWorkflowStore } from "../store/workflowStore";

export default function CustomNode({ id, data, isConnectable, selected }) {
  const deleteNode = useWorkflowStore(state => state.deleteNode);
  const nodeExecutionData = useWorkflowStore(state => state.nodeExecutionData[id]);
  const [isHovered, setIsHovered] = useState(false);

  const status = nodeExecutionData?.status;
  const duration = nodeExecutionData?.duration;

  let statusColor = "transparent";
  let statusGlow = "none";
  let statusText = "";

  if (status === "pending" || status === "running") {
    statusColor = "#eab308"; // yellow-500
    statusGlow = "0 0 8px rgba(234, 179, 8, 0.6)";
    statusText = "Running...";
  } else if (status === "completed") {
    statusColor = "#22c55e"; // green-500
    statusGlow = "0 0 8px rgba(34, 197, 94, 0.6)";
    statusText = duration ? `${duration}ms` : "Done";
  } else if (status === "failed") {
    statusColor = "#ef4444"; // red-500
    statusGlow = "0 0 8px rgba(239, 68, 68, 0.6)";
    statusText = "Failed";
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        background: "rgba(30, 41, 59, 0.95)", // slate-800 with opacity
        backdropFilter: "blur(8px)",
        border: `1px solid ${selected ? "#3b82f6" : "rgba(148, 163, 184, 0.2)"}`, // border-slate-400/20 or blue
        borderRadius: "12px",
        minWidth: "200px",
        color: "#f8fafc", // slate-50
        boxShadow: selected 
          ? "0 0 0 1px #3b82f6, 0 4px 15px rgba(59, 130, 246, 0.2)" 
          : "0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
        transition: "all 0.2s ease-in-out",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        isConnectable={isConnectable}
        style={{
          width: "12px",
          height: "12px",
          background: "#94a3b8",
          border: "2px solid #1e293b",
          top: "-6px"
        }}
      />

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
          background: "rgba(255, 255, 255, 0.03)",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Status Indicator */}
          <div 
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: statusColor !== "transparent" ? statusColor : "#64748b",
              boxShadow: statusGlow,
              transition: "all 0.3s ease"
            }}
          />
          <strong style={{ fontSize: "13px", fontWeight: "600", letterSpacing: "0.2px" }}>
            {data.label || data.type}
          </strong>
        </div>

        {/* Delete Button (Visible on Hover) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(id);
          }}
          style={{
            background: "transparent",
            color: "#ef4444",
            border: "none",
            borderRadius: "4px",
            width: "22px",
            height: "22px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: isHovered ? 1 : 0,
            transition: "all 0.2s ease",
            padding: 0
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          title="Delete Node"
        >
          ✕
        </button>
      </div>

      {/* BODY */}
      <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {data.type && (
          <div style={{ fontSize: "11px", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>{data.type}</span>
            {statusText && <span style={{ color: statusColor }}>{statusText}</span>}
          </div>
        )}
        {/* We can show additional config properties here if desired, but keeping it minimal is cleaner */}
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        isConnectable={isConnectable}
        style={{
          width: "12px",
          height: "12px",
          background: "#94a3b8",
          border: "2px solid #1e293b",
          bottom: "-6px"
        }}
      />
    </div>
  );
}
