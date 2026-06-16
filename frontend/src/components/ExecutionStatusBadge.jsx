import React from "react";

const styles = {
  running: {
    label: "Running",
    color: "#f59e0b",
    background: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.45)"
  },
  completed: {
    label: "Completed",
    color: "#22c55e",
    background: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.45)"
  },
  failed: {
    label: "Failed",
    color: "#ef4444",
    background: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.45)"
  }
};

export default function ExecutionStatusBadge({ status }) {
  const style = styles[status] || {
    label: status || "Unknown",
    color: "#94a3b8",
    background: "rgba(148, 163, 184, 0.12)",
    border: "rgba(148, 163, 184, 0.45)"
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${style.border}`,
        borderRadius: 999,
        background: style.background,
        color: style.color,
        fontSize: 12,
        fontWeight: 700,
        padding: "3px 9px",
        textTransform: "uppercase",
        letterSpacing: 0
      }}
    >
      {style.label}
    </span>
  );
}
