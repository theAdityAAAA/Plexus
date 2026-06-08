import React, { useState } from "react";
import { EdgeLabelRenderer, getBezierPath } from "reactflow";
import { useWorkflowStore } from "../store/workflowStore";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const deleteEdge = useWorkflowStore((state) => state.deleteEdge);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, strokeWidth: isHovered ? (style.strokeWidth || 3) + 1 : style.strokeWidth || 3 }}
      />
      {/* Invisible thicker path for easier hovering */}
      <path
        d={edgePath}
        fill="none"
        strokeOpacity={0}
        strokeWidth={30}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: "crosshair" }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            zIndex: 100,
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {label && (
            <div style={{ background: "#334155", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" }}>
              {label}
            </div>
          )}
          
          {isHovered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteEdge(id);
              }}
              style={{
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                fontSize: "10px",
                fontWeight: "bold",
                lineHeight: "1",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
              }}
              title="Delete Edge"
            >
              ✕
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
