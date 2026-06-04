import React from "react";
import Editor from "@monaco-editor/react";

export default function MonacoCodeEditor({ code, onChange, readOnly = false }) {
  return (
    <div className="border border-secondary rounded overflow-hidden" style={{ height: "300px" }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        theme="vs-dark"
        value={code}
        onChange={(val) => onChange(val || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          readOnly,
          padding: { top: 16 }
        }}
      />
    </div>
  );
}
