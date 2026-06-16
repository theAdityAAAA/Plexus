import React, { useMemo, useRef, useState } from "react";
import { useWorkflowStore } from "../store/workflowStore";
import VariableExplorer from "./VariableExplorer";
import {
  buildOutputNamespace,
  buildVariableTree,
  flattenVariableTree,
  getVariableExpression,
  resolveTemplate,
  validateTemplate
} from "../utils/variableUtils";

function insertAtCursor(value, insertion, start, end) {
  const safeStart = Number.isInteger(start) ? start : value.length;
  const safeEnd = Number.isInteger(end) ? end : safeStart;
  return `${value.slice(0, safeStart)}${insertion}${value.slice(safeEnd)}`;
}

function getAutocompleteTerm(value, cursor) {
  const beforeCursor = value.slice(0, cursor);
  const openIndex = beforeCursor.lastIndexOf("{{");
  const closeIndex = beforeCursor.lastIndexOf("}}");

  if (openIndex === -1 || closeIndex > openIndex) return null;

  return beforeCursor.slice(openIndex + 2).trim().toLowerCase();
}

export default function VariableField({
  id,
  type = "text",
  value,
  defaultValue = "",
  onChange,
  placeholder
}) {
  const inputRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);

  const nodes = useWorkflowStore((state) => state.nodes);
  const nodeExecutionData = useWorkflowStore((state) => state.nodeExecutionData);
  const stringValue = value ?? defaultValue ?? "";

  const namespace = useMemo(
    () => buildOutputNamespace(nodes, nodeExecutionData),
    [nodes, nodeExecutionData]
  );

  const suggestions = useMemo(
    () => flattenVariableTree(buildVariableTree(namespace)).filter((item) => !item.hasChildren),
    [namespace]
  );

  const invalidReferences = useMemo(
    () => validateTemplate(String(stringValue), namespace),
    [stringValue, namespace]
  );

  const preview = useMemo(
    () => resolveTemplate(String(stringValue), namespace),
    [stringValue, namespace]
  );

  const updateCursor = () => {
    const input = inputRef.current;
    if (!input) return;
    setCursorPosition(input.selectionStart);
    setAutocompleteOpen(getAutocompleteTerm(input.value, input.selectionStart) !== null);
  };

  const commitValue = (nextValue, nextCursor) => {
    onChange(nextValue);

    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
      setCursorPosition(nextCursor);
    });
  };

  const insertVariable = (path) => {
    const input = inputRef.current;
    const expression = getVariableExpression(path);
    const start = input?.selectionStart ?? cursorPosition ?? String(stringValue).length;
    const end = input?.selectionEnd ?? start;
    const nextValue = insertAtCursor(String(stringValue), expression, start, end);
    const nextCursor = start + expression.length;

    commitValue(nextValue, nextCursor);
    setPickerOpen(false);
    setAutocompleteOpen(false);
  };

  const applyAutocomplete = (path) => {
    const input = inputRef.current;
    if (!input) return insertVariable(path);

    const currentValue = String(stringValue);
    const cursor = input.selectionStart ?? currentValue.length;
    const beforeCursor = currentValue.slice(0, cursor);
    const openIndex = beforeCursor.lastIndexOf("{{");
    const replacement = getVariableExpression(path);

    if (openIndex === -1) return insertVariable(path);

    const nextValue = `${currentValue.slice(0, openIndex)}${replacement}${currentValue.slice(cursor)}`;
    const nextCursor = openIndex + replacement.length;
    commitValue(nextValue, nextCursor);
    setAutocompleteOpen(false);
  };

  const autocompleteTerm = getAutocompleteTerm(String(stringValue), cursorPosition ?? String(stringValue).length);
  const filteredSuggestions = autocompleteTerm === null
    ? []
    : suggestions
        .filter((item) => item.path.toLowerCase().includes(autocompleteTerm))
        .slice(0, 8);

  const showPreview = String(stringValue).includes("{{");

  return (
    <div style={{ position: "relative" }}>
      <div className="d-flex gap-2">
        <input
          id={id}
          ref={inputRef}
          type={type === "number" ? "text" : type}
          inputMode={type === "number" ? "numeric" : undefined}
          className={`form-control bg-dark text-white ${
            invalidReferences.length > 0 ? "border-warning" : "border-secondary"
          }`}
          value={stringValue}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value);
            setCursorPosition(event.target.selectionStart);
            setAutocompleteOpen(getAutocompleteTerm(event.target.value, event.target.selectionStart) !== null);
          }}
          onClick={updateCursor}
          onKeyUp={updateCursor}
          onFocus={updateCursor}
        />

        <button
          type="button"
          className="btn btn-outline-info"
          title="Insert variable"
          onClick={() => {
            updateCursor();
            setPickerOpen((open) => !open);
          }}
          style={{ minWidth: 42 }}
        >
          {"{}"}
        </button>

        {invalidReferences.length > 0 && (
          <span
            className="d-inline-flex align-items-center justify-content-center text-warning"
            title={`Variable not available: ${invalidReferences.join(", ")}`}
            style={{ width: 24, fontWeight: 700 }}
          >
            !
          </span>
        )}
      </div>

      {pickerOpen && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 2000 }}>
          <VariableExplorer
            compact
            title="Insert Variable"
            onSelect={insertVariable}
          />
        </div>
      )}

      {autocompleteOpen && filteredSuggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 52,
            top: "calc(100% + 6px)",
            background: "#111827",
            border: "1px solid #334155",
            borderRadius: 8,
            boxShadow: "0 14px 42px rgba(0,0,0,0.35)",
            zIndex: 2100,
            overflow: "hidden"
          }}
        >
          {filteredSuggestions.map((item) => (
            <button
              key={item.path}
              type="button"
              className="w-100 border-0 text-start"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyAutocomplete(item.path)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 10px",
                background: "transparent",
                color: "#e2e8f0",
                fontSize: 12
              }}
            >
              <span className="text-truncate">{item.path}</span>
              <span style={{ color: "#94a3b8" }}>{item.type}</span>
            </button>
          ))}
        </div>
      )}

      {showPreview && (
        <div
          className={invalidReferences.length > 0 ? "text-warning" : "text-white-50"}
          style={{ fontSize: 12, marginTop: 6, lineHeight: 1.4 }}
        >
          Preview: {preview.value || "Variable not available"}
        </div>
      )}
    </div>
  );
}
