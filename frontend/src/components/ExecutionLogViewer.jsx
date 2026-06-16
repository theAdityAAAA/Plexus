import React, { useMemo, useState } from "react";
import ExecutionStatusBadge from "./ExecutionStatusBadge";

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function getLogText(log) {
  return [
    log.nodeId,
    log.status,
    log.error,
    log.output ? JSON.stringify(log.output) : ""
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export default function ExecutionLogViewer({ logs = [] }) {
  const [search, setSearch] = useState("");

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return logs;

    return logs.filter((log) => getLogText(log).includes(term));
  }, [logs, search]);

  return (
    <div className="bg-dark border border-secondary rounded p-3">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
        <h6 className="text-white mb-0">Execution Logs</h6>
        <input
          className="form-control form-control-sm bg-dark text-white border-secondary"
          style={{ maxWidth: 260 }}
          placeholder="Search logs..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {filteredLogs.length === 0 && (
          <div className="text-white-50 small">No logs match this search.</div>
        )}

        {filteredLogs.map((log, index) => (
          <div
            key={log._id || `${log.nodeId}-${index}`}
            className="border rounded p-3 mb-2"
            style={{
              background: log.status === "failed" ? "rgba(127, 29, 29, 0.28)" : "#020617",
              borderColor: log.status === "failed" ? "#ef4444" : "#334155"
            }}
          >
            <div className="d-flex align-items-center justify-content-between gap-2">
              <span className="font-monospace text-white text-truncate">{log.nodeId || "Unknown node"}</span>
              <ExecutionStatusBadge status={log.status} />
            </div>

            <div className="text-white-50 mt-2" style={{ fontSize: 12 }}>
              {formatTime(log.timestamp || log.startedAt)}
              {log.duration != null ? ` | ${log.duration} ms` : ""}
            </div>

            {log.error && (
              <div className="text-danger mt-2" style={{ fontSize: 13 }}>
                {log.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
