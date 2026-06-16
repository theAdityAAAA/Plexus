import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { useWorkflowStore } from "../store/workflowStore";

// Icon components for a premium look

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function CustomNode({ id, data, isConnectable, selected }) {
  const deleteNode = useWorkflowStore(state => state.deleteNode);
  const nodeExecutionData = useWorkflowStore(state => state.nodeExecutionData[id]);
  const [isHovered, setIsHovered] = useState(false);

  const status = nodeExecutionData?.status;
  const duration = nodeExecutionData?.duration;

  // Node Category Colors for Top Accent Line & Icon Background
  const categoryStr = (data.category || "").toLowerCase();
  let categoryColor = "#64748b"; // slate-500 (default)
  let categoryBg = "#f1f5f9"; // slate-100
  
  if (categoryStr.includes("trigger") || data.type?.includes("trigger")) {
    categoryColor = "#8b5cf6"; // violet-500
    categoryBg = "#ede9fe"; // violet-100
  } else if (categoryStr.includes("action") || data.type?.includes("action")) {
    categoryColor = "#3b82f6"; // blue-500
    categoryBg = "#dbeafe"; // blue-100
  } else if (categoryStr.includes("logic") || data.type?.includes("condition") || data.type?.includes("decision")) {
    categoryColor = "#f59e0b"; // amber-500
    categoryBg = "#fef3c7"; // amber-100
  } else if (categoryStr.includes("custom")) {
    categoryColor = "#10b981"; // emerald-500
    categoryBg = "#d1fae5"; // emerald-100
  }

  // Node Status Visuals
  let statusColor = "transparent";
  let statusBorder = "transparent";
  let statusBg = "transparent";
  let statusText = "";
  let StatusIcon = null;

  if (status === "pending" || status === "running") {
    statusColor = "#eab308"; // yellow-500
    statusBorder = "#fef08a"; // yellow-200
    statusBg = "#fef9c3"; // yellow-100
    statusText = "Running...";
    StatusIcon = PlayIcon;
  } else if (status === "completed") {
    statusColor = "#22c55e"; // green-500
    statusBorder = "#bbf7d0"; // green-200
    statusBg = "#dcfce7"; // green-100
    statusText = duration ? `${duration}ms` : "Done";
    StatusIcon = CheckIcon;
  } else if (status === "failed") {
    statusColor = "#ef4444"; // red-500
    statusBorder = "#fecaca"; // red-200
    statusBg = "#fee2e2"; // red-100
    statusText = "Failed";
    StatusIcon = XIcon;
  }

  // Generate a fallback icon based on first letter if no emoji icon exists
  // Emojis are typically 1-2 length, handle simple strings vs full URLs
  const hasEmojiIcon = data.icon && data.icon.length <= 4 && !data.icon.startsWith("http");
  const defaultIcon = data.label ? data.label.charAt(0).toUpperCase() : data.type?.charAt(0).toUpperCase() || "N";

  // Box Shadows based on state
  const defaultShadow = "0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)";
  const hoverShadow = "0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 24px rgba(0, 0, 0, 0.08)";
  const selectedShadow = "0 0 0 2px #bde2f2, 0 0 0 4px #3b82f6, 0 4px 12px rgba(59, 130, 246, 0.3)";
  const errorShadow = "0 0 0 2px #bde2f2, 0 0 0 4px #ef4444, 0 4px 12px rgba(239, 68, 68, 0.3)";
  const runningShadow = "0 0 0 2px #fef08a, 0 0 0 5px rgba(234, 179, 8, 0.45), 0 12px 28px rgba(234, 179, 8, 0.2)";
  const successShadow = "0 0 0 2px #bbf7d0, 0 0 0 4px rgba(34, 197, 94, 0.35), 0 10px 24px rgba(34, 197, 94, 0.16)";

  let currentShadow = defaultShadow;
  let currentBorder = "#E5E7EB"; // Light gray border

  if (status === "failed") {
    currentShadow = errorShadow;
    currentBorder = "#ef4444";
  } else if (status === "running" || status === "pending") {
    currentShadow = runningShadow;
    currentBorder = "#eab308";
  } else if (status === "completed") {
    currentShadow = successShadow;
    currentBorder = "#22c55e";
  } else if (selected) {
    currentShadow = selectedShadow;
    currentBorder = "#3b82f6";
  } else if (isHovered) {
    currentShadow = hoverShadow;
    currentBorder = "#d1d5db"; // slightly darker border on hover
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        background: "#bde2f2",
        border: `1px solid ${currentBorder}`,
        borderRadius: "16px",
        minWidth: "260px",
        color: "#1e293b", // slate-800
        boxShadow: currentShadow,
        transition: "all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)",
        fontFamily: "'Inter', 'Poppins', 'Segoe UI', sans-serif",
        overflow: "hidden",
        transform: isHovered && !selected ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Target Handle */}
      <Handle 
        type="target" 
        position={Position.Top} 
        isConnectable={isConnectable}
        style={{
          width: "14px",
          height: "14px",
          background: "#bde2f2",
          border: `2px solid ${categoryColor}`,
          top: "-7px",
          zIndex: 10,
          transition: "all 0.2s ease"
        }}
      />

      {/* Top Accent Line */}
      <div style={{ height: "4px", width: "100%", background: categoryColor }} />

      {/* HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 16px 12px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Node Icon */}
          <div 
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: categoryBg,
              color: categoryColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: hasEmojiIcon ? "18px" : "16px",
              fontWeight: "600",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5)"
            }}
          >
            {hasEmojiIcon ? data.icon : defaultIcon}
          </div>
          
          <div style={{ display: "flex", flexDirection: "column" }}>
            <strong style={{ 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#0f172a", // slate-900
              lineHeight: "1.2",
              letterSpacing: "-0.01em"
            }}>
              {data.label || data.name || data.type}
            </strong>
            {data.category && (
              <span style={{ 
                fontSize: "11px", 
                fontWeight: "500", 
                color: categoryColor,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginTop: "2px"
              }}>
                {data.category}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ display: "flex", gap: "4px", opacity: isHovered || selected ? 1 : 0.4, transition: "opacity 0.2s ease" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            style={{
              background: "transparent",
              color: "#ef4444",
              border: "none",
              borderRadius: "6px",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              padding: 0
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fee2e2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            title="Delete Node"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* BODY - Configuration Summary */}
      <div style={{ 
        padding: "0 16px 16px 16px", 
        display: "flex", 
        flexDirection: "column", 
        gap: "8px" 
      }}>
        <div style={{ 
          background: "#f8fafc", // slate-50
          border: "1px solid #f1f5f9",
          borderRadius: "8px",
          padding: "10px 12px",
          fontSize: "12px",
          color: "#475569", // slate-600
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: data.description ? "6px" : "0" }}>
            <span style={{ fontWeight: "500", color: "#334155" }}>Operation</span>
            <span style={{ fontFamily: "monospace", fontSize: "11px", background: "#e2e8f0", padding: "2px 6px", borderRadius: "4px" }}>
              {data.type}
            </span>
          </div>
          {data.description && (
            <div style={{ color: "#64748b", lineHeight: "1.4" }}>
              {data.description}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER - Status */}
      {status && status !== "idle" && (
        <div style={{
          padding: "10px 16px",
          background: statusBg,
          borderTop: `1px solid ${statusBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "12px",
          fontWeight: "500",
          color: statusColor
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {StatusIcon && <StatusIcon />}
            <span>{statusText}</span>
          </div>
          {status === "failed" && (
            <span style={{ 
              fontSize: "10px", 
              background: "#ef4444", 
              color: "white", 
              padding: "2px 6px", 
              borderRadius: "10px",
              fontWeight: "600"
            }}>
              ERROR
            </span>
          )}
        </div>
      )}

      {/* Source Handle */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        isConnectable={isConnectable}
        style={{
          width: "14px",
          height: "14px",
          background: "#bde2f2",
          border: `2px solid ${categoryColor}`,
          bottom: "-7px",
          zIndex: 10,
          transition: "all 0.2s ease"
        }}
      />
    </div>
  );
}
