import React, { useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";

function IssueList({ title, issues, color }) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="mb-2">
      <div style={{ color, fontSize: 12, fontWeight: 700, textTransform: "uppercase" }}>
        {title}
      </div>

      <div className="d-flex flex-column gap-1 mt-1">
        {issues.map((issue, index) => (
          <div key={`${issue.code}-${index}`} className="small text-white-50">
            <span className="text-white">{issue.code}</span>: {issue.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GraphValidationPanel() {
  const validation = useWorkflowStore((state) => state.graphValidationReport);
  const clearGraphValidationReport = useWorkflowStore(
    (state) => state.clearGraphValidationReport
  );
  const [expanded, setExpanded] = useState(false);

  if (!validation) return null;

  const hasIssues =
    validation.summary?.warningCount > 0 ||
    validation.summary?.errorCount > 0;

  return (
    <div
      className="position-absolute bg-dark border border-secondary rounded"
      style={{
        right: 440,
        top: 10,
        width: 360,
        zIndex: 12,
        boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
        overflow: "hidden"
      }}
    >
      <div className="d-flex align-items-center justify-content-between gap-2 p-3">
        <div>
          <div className={validation.valid ? "text-success" : "text-warning"} style={{ fontWeight: 700 }}>
            Graph Validation {validation.valid ? "Passed" : "Has Issues"}
          </div>
          <div className="text-white-50 small">
            {validation.summary?.nodeCount || 0} nodes, {validation.summary?.edgeCount || 0} edges
            {hasIssues
              ? `, ${validation.summary?.warningCount || 0} warnings, ${validation.summary?.errorCount || 0} errors`
              : ""}
          </div>
        </div>

        <div className="d-flex gap-2">
          {hasIssues && (
            <button
              type="button"
              className="btn btn-sm btn-outline-info"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Hide" : "Details"}
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={clearGraphValidationReport}
          >
            X
          </button>
        </div>
      </div>

      {expanded && hasIssues && (
        <div className="border-top border-secondary p-3" style={{ maxHeight: 260, overflowY: "auto" }}>
          <IssueList title="Errors" issues={validation.errors} color="#f87171" />
          <IssueList title="Warnings" issues={validation.warnings} color="#facc15" />

          {validation.roots?.length > 0 && (
            <div className="small text-white-50 mt-2">
              <span className="text-white">Roots:</span> {validation.roots.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
