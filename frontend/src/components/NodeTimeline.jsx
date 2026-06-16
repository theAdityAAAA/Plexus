import React from "react";
import ExecutionStatusBadge from "./ExecutionStatusBadge";

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function NodeTimeline({ logs = [], onSelectLog, selectedLogId }) {
  if (!logs.length) {
    return (
      <div className="bg-dark border border-secondary rounded p-3 text-white-50">
        No node logs recorded for this execution.
      </div>
    );
  }

  return (
    <div className="bg-dark border border-secondary rounded p-3">
      <h6 className="text-white mb-3">Node Timeline</h6>

      <div className="d-flex flex-column gap-2">
        {logs.map((log, index) => {
          const id = log._id || `${log.nodeId}-${index}`;
          const selected = selectedLogId === id;

          return (
            <button
              key={id}
              type="button"
              className="text-start border rounded"
              onClick={() => onSelectLog?.(log, id)}
              style={{
                background: selected ? "#1e293b" : "#020617",
                borderColor: selected ? "#38bdf8" : "#334155",
                padding: 12,
                color: "#e2e8f0"
              }}
            >
              <div className="d-flex align-items-center justify-content-between gap-2">
                <span className="font-monospace text-truncate">{log.nodeId || "Unknown node"}</span>
                <ExecutionStatusBadge status={log.status} />
              </div>

              <div className="d-flex align-items-center justify-content-between mt-2 text-white-50" style={{ fontSize: 12 }}>
                <span>{formatTime(log.timestamp || log.startedAt)}</span>
                <span>{log.duration != null ? `${log.duration} ms` : "-"}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
