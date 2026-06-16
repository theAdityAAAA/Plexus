import React, { useEffect } from "react";
import { useExecutionStore } from "../store/executionStore";
import ExecutionStatusBadge from "./ExecutionStatusBadge";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function getDuration(startedAt, completedAt) {
  if (!startedAt) return "-";
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const start = new Date(startedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "-";
  return `${Math.max(0, end - start)} ms`;
}

export default function ExecutionHistoryPage({ onOpenExecution }) {
  const {
    executions,
    loading,
    error,
    search,
    statusFilter,
    setSearch,
    setStatusFilter,
    fetchExecutions
  } = useExecutionStore();

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  return (
    <div style={{ height: "calc(100vh - 60px)", overflow: "auto", padding: 24 }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="text-white mb-1">Execution History</h4>
          <div className="text-white-50 small">Read-only history from persisted execution records.</div>
        </div>

        <button className="btn btn-outline-info" type="button" onClick={fetchExecutions}>
          Refresh
        </button>
      </div>

      <div className="bg-dark border border-secondary rounded p-3 mb-3">
        <div className="row g-3">
          <div className="col-md-8">
            <input
              className="form-control bg-dark text-white border-secondary"
              placeholder="Search execution id, workflow id, or current node..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") fetchExecutions();
              }}
            />
          </div>

          <div className="col-md-2">
            <select
              className="form-select bg-dark text-white border-secondary"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="col-md-2">
            <button className="btn btn-primary w-100" type="button" onClick={fetchExecutions}>
              Apply
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="bg-dark border border-secondary rounded overflow-hidden">
        <table className="table table-dark table-hover mb-0 align-middle">
          <thead>
            <tr>
              <th>Execution ID</th>
              <th>Status</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Workflow</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="6" className="text-white-50">Loading executions...</td>
              </tr>
            )}

            {!loading && executions.length === 0 && (
              <tr>
                <td colSpan="6" className="text-white-50">No executions found.</td>
              </tr>
            )}

            {!loading && executions.map((execution) => (
              <tr
                key={execution.executionId}
                onClick={() => onOpenExecution(execution.executionId)}
                style={{ cursor: "pointer" }}
              >
                <td className="font-monospace text-info">{execution.executionId}</td>
                <td><ExecutionStatusBadge status={execution.status} /></td>
                <td>{formatDate(execution.startedAt)}</td>
                <td>{formatDate(execution.completedAt)}</td>
                <td>{getDuration(execution.startedAt, execution.completedAt)}</td>
                <td className="font-monospace text-white-50">{execution.workflowId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
