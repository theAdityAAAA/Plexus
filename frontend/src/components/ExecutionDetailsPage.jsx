import React, { useEffect, useState } from "react";
import { useExecutionStore } from "../store/executionStore";
import ExecutionStatusBadge from "./ExecutionStatusBadge";
import ExecutionLogViewer from "./ExecutionLogViewer";
import NodeTimeline from "./NodeTimeline";
import OutputInspector from "./OutputInspector";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function getDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return "-";
  return `${Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime())} ms`;
}

export default function ExecutionDetailsPage({ executionId, onBack }) {
  const { selectedExecution, loading, error, fetchExecutionById } = useExecutionStore();
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedLogId, setSelectedLogId] = useState(null);

  useEffect(() => {
    fetchExecutionById(executionId);
    setSelectedLog(null);
    setSelectedLogId(null);
  }, [executionId, fetchExecutionById]);

  if (loading && !selectedExecution) {
    return (
      <div style={{ padding: 24 }} className="text-white-50">
        Loading execution...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <button className="btn btn-outline-light mb-3" type="button" onClick={onBack}>Back</button>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!selectedExecution) {
    return (
      <div style={{ padding: 24 }}>
        <button className="btn btn-outline-light mb-3" type="button" onClick={onBack}>Back</button>
        <div className="text-white-50">Execution not found.</div>
      </div>
    );
  }

  const execution = selectedExecution;
  const logs = execution.logs || [];

  return (
    <div style={{ height: "calc(100vh - 60px)", overflow: "auto", padding: 24 }}>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <button className="btn btn-sm btn-outline-light mb-3" type="button" onClick={onBack}>
            Back to History
          </button>
          <h4 className="text-white mb-1">Execution Details</h4>
          <div className="text-info font-monospace small">{execution.executionId}</div>
        </div>

        <ExecutionStatusBadge status={execution.status} />
      </div>

      <div className="row g-3 mb-3">
        <div className="col-xl-3 col-md-6">
          <div className="bg-dark border border-secondary rounded p-3 h-100">
            <div className="text-white-50 small">Workflow ID</div>
            <div className="text-white font-monospace text-break">{execution.workflowId}</div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="bg-dark border border-secondary rounded p-3 h-100">
            <div className="text-white-50 small">Current Node</div>
            <div className="text-white font-monospace text-break">{execution.currentNodeId || "-"}</div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="bg-dark border border-secondary rounded p-3 h-100">
            <div className="text-white-50 small">Started</div>
            <div className="text-white">{formatDate(execution.startedAt)}</div>
            <div className="text-white-50 small mt-2">Completed</div>
            <div className="text-white">{formatDate(execution.completedAt)}</div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6">
          <div className="bg-dark border border-secondary rounded p-3 h-100">
            <div className="text-white-50 small">Computed Duration</div>
            <div className="text-white">{getDuration(execution.startedAt, execution.completedAt)}</div>
            <div className="text-white-50 small mt-2">Log Entries</div>
            <div className="text-white">{logs.length}</div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <OutputInspector title="Execution Input" data={execution.input} />
        </div>
        <div className="col-lg-6">
          <OutputInspector title="Execution Outputs" data={execution.outputs} />
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-lg-5">
          <NodeTimeline
            logs={logs}
            selectedLogId={selectedLogId}
            onSelectLog={(log, id) => {
              setSelectedLog(log);
              setSelectedLogId(id);
            }}
          />
        </div>
        <div className="col-lg-7">
          <OutputInspector
            title={selectedLog ? `Node Output: ${selectedLog.nodeId}` : "Node Output"}
            data={selectedLog?.output}
          />
        </div>
      </div>

      <ExecutionLogViewer logs={logs} />
    </div>
  );
}
