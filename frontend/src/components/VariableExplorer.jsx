import React, { useMemo, useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import {
  buildOutputNamespace,
  buildVariableTree,
  flattenVariableTree,
  getVariableExpression
} from "../utils/variableUtils";

const typeColors = {
  string: "#38bdf8",
  number: "#f59e0b",
  boolean: "#22c55e",
  array: "#a78bfa",
  object: "#94a3b8",
  null: "#64748b",
  undefined: "#64748b"
};

function VariableRow({ item, depth, expanded, expandedPaths, onToggle, onSelect, compact }) {
  const hasChildren = item.children.length > 0;
  const isLeaf = !hasChildren;
  const color = typeColors[item.type] || "#94a3b8";

  return (
    <>
      <button
        type="button"
        className="w-100 border-0 text-start"
        onClick={() => (isLeaf ? onSelect?.(item.path) : onToggle(item.path))}
        onDoubleClick={() => onSelect?.(item.path)}
        style={{
          display: "grid",
          gridTemplateColumns: "20px minmax(0, 1fr) auto",
          alignItems: "center",
          gap: 6,
          padding: compact ? "6px 8px" : "7px 10px",
          paddingLeft: 8 + depth * 14,
          background: "transparent",
          color: "#e2e8f0",
          borderRadius: 6,
          cursor: "pointer"
        }}
        title={isLeaf ? `Insert ${getVariableExpression(item.path)}` : item.path}
      >
        <span style={{ color: "#94a3b8", fontSize: 11 }}>
          {hasChildren ? (expanded ? "v" : ">") : "-"}
        </span>

        <span className="text-truncate" style={{ fontSize: compact ? 12 : 13 }}>
          {item.label}
        </span>

        <span
          style={{
            color,
            fontSize: 10,
            border: `1px solid ${color}`,
            borderRadius: 999,
            padding: "1px 6px",
            lineHeight: 1.4
          }}
        >
          {item.type}
        </span>
      </button>

      {hasChildren && expanded &&
        item.children.map((child) => (
          <VariableTreeItem
            key={child.path}
            item={child}
            depth={depth + 1}
            expandedPaths={expandedPaths}
            onToggle={onToggle}
            onSelect={onSelect}
            compact={compact}
          />
        ))}
    </>
  );
}

function VariableTreeItem({ item, depth, expandedPaths, onToggle, onSelect, compact }) {
  const expanded = expandedPaths.has(item.path);

  return (
    <VariableRow
      item={item}
      depth={depth}
      expanded={expanded}
      expandedPaths={expandedPaths}
      onToggle={onToggle}
      onSelect={onSelect}
      compact={compact}
    />
  );
}

function filterTree(tree, query) {
  const term = query.trim().toLowerCase();
  if (!term) return tree;

  const matches = (node) =>
    node.path.toLowerCase().includes(term) ||
    node.type.toLowerCase().includes(term);

  const visit = (node) => {
    const children = node.children.map(visit).filter(Boolean);
    if (matches(node) || children.length > 0) {
      return { ...node, children };
    }
    return null;
  };

  return tree.map(visit).filter(Boolean);
}

export default function VariableExplorer({
  onSelect,
  compact = false,
  title = "Variables",
  style = {}
}) {
  const nodes = useWorkflowStore((state) => state.nodes);
  const nodeExecutionData = useWorkflowStore((state) => state.nodeExecutionData);
  const [query, setQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState(() => new Set());

  const namespace = useMemo(
    () => buildOutputNamespace(nodes, nodeExecutionData),
    [nodes, nodeExecutionData]
  );

  const tree = useMemo(() => buildVariableTree(namespace), [namespace]);
  const flatVariables = useMemo(() => flattenVariableTree(tree), [tree]);
  const visibleTree = useMemo(() => filterTree(tree, query), [tree, query]);
  const visibleExpandedPaths = useMemo(() => {
    if (!query.trim()) return expandedPaths;

    return new Set(
      flattenVariableTree(visibleTree)
        .filter((item) => item.hasChildren)
        .map((item) => item.path)
    );
  }, [expandedPaths, query, visibleTree]);

  const toggle = (path) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPaths(new Set(flatVariables.filter((item) => item.hasChildren).map((item) => item.path)));
  };

  const collapseAll = () => setExpandedPaths(new Set());

  const hasVariables = flatVariables.length > 0;

  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #334155",
        borderRadius: 8,
        boxShadow: compact ? "0 16px 48px rgba(0,0,0,0.35)" : "0 8px 24px rgba(0,0,0,0.25)",
        color: "#e2e8f0",
        width: compact ? 360 : 320,
        maxHeight: compact ? 420 : "calc(100vh - 110px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style
      }}
    >
      <div style={{ padding: compact ? 10 : 12, borderBottom: "1px solid #334155" }}>
        <div className="d-flex align-items-center justify-content-between mb-2">
          <strong style={{ fontSize: 13 }}>{title}</strong>
          <span style={{ color: "#94a3b8", fontSize: 11 }}>
            {flatVariables.length} paths
          </span>
        </div>

        <input
          className="form-control form-control-sm bg-dark text-white border-secondary"
          placeholder="Search variables..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="d-flex gap-2 mt-2">
          <button type="button" className="btn btn-sm btn-outline-secondary py-0" onClick={expandAll}>
            Expand
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary py-0" onClick={collapseAll}>
            Collapse
          </button>
        </div>
      </div>

      <div style={{ overflowY: "auto", padding: 8 }}>
        {!hasVariables && (
          <div style={{ color: "#94a3b8", fontSize: 12, padding: 12, lineHeight: 1.5 }}>
            Run the workflow to populate execution outputs. Aliases become the top-level variable names.
          </div>
        )}

        {hasVariables && visibleTree.length === 0 && (
          <div style={{ color: "#94a3b8", fontSize: 12, padding: 12 }}>
            No variables match this search.
          </div>
        )}

        {visibleTree.map((item) => (
          <VariableTreeItem
            key={item.path}
            item={item}
            depth={0}
            expandedPaths={visibleExpandedPaths}
            onToggle={toggle}
            onSelect={onSelect}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}
