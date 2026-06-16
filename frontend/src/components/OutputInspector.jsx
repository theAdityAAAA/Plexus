import React, { useMemo, useState } from "react";

function stringify(value) {
  if (value === undefined) return "No data available";
  return JSON.stringify(value, null, 2);
}

export default function OutputInspector({ title = "Output", data }) {
  const [copied, setCopied] = useState(false);
  const formatted = useMemo(() => stringify(data), [data]);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  return (
    <div className="bg-dark border border-secondary rounded p-3 h-100">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h6 className="text-white mb-0">{title}</h6>
        <button className="btn btn-sm btn-outline-info" type="button" onClick={copyOutput}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre
        className="mb-0 text-white-50"
        style={{
          maxHeight: 320,
          overflow: "auto",
          fontSize: 12,
          whiteSpace: "pre-wrap"
        }}
      >
        {formatted}
      </pre>
    </div>
  );
}
