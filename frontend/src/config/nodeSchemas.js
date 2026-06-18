export const nodeSchemas = {
  // --- TRIGGERS ---
  "webhook-trigger": [
    { key: "method", label: "Allowed HTTP Method", type: "select", options: ["ANY", "GET", "POST", "PUT", "DELETE"], default: "ANY" }
  ],
  "http-request": [
    { key: "endpoint", label: "Endpoint Path", type: "text", default: "/api/v1/custom" },
    { key: "method", label: "HTTP Method", type: "select", options: ["GET", "POST", "PUT", "DELETE"], default: "GET" },
    { key: "authType", label: "Authentication Type", type: "select", options: ["None", "Basic", "Bearer"], default: "None" }
  ],
  "schedule": [
    { key: "cron", label: "Cron Expression", type: "text", default: "0 * * * *" },
    { key: "timezone", label: "Timezone", type: "text", default: "UTC" }
  ],
  "event-listener": [
    { key: "eventSource", label: "Event Source", type: "text", default: "Kafka" },
    { key: "topic", label: "Topic / Channel", type: "text", default: "my-topic" }
  ],

  // --- DATABASE & STORAGE ---
  "db-query": [
    {
      key: "collection",
      label: "Collection",
      type: "text",
      default: "users"
    },
    {
      key: "query",
      label: "Query JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "projection",
      label: "Projection JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "sort",
      label: "Sort JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "limit",
      label: "Limit",
      type: "number",
      default: 50
    }
  ],
  "db-insert": [
    {
      key: "collection",
      label: "Collection",
      type: "text",
      default: "users"
    },
    {
      key: "data",
      label: "Data JSON",
      type: "text",
      default: "{}"
    }
  ],
  "db-delete": [
    {
      key: "collection",
      label: "Collection",
      type: "text",
      default: "users"
    },
    {
      key: "filter",
      label: "Filter JSON",
      type: "text",
      default: "{}"
    }
  ],
  "db-update": [
    {
      key: "collection",
      label: "Collection",
      type: "text",
      default: "users"
    },
    {
      key: "filter",
      label: "Filter JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "update",
      label: "Update JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "upsert",
      label: "Upsert",
      type: "checkbox",
      default: false
    },
    {
      key: "allowCollectionWideUpdate",
      label: "Allow Collection-wide Update",
      type: "checkbox",
      default: false
    }
  ],
  "mongo-find": [
    {
      key: "collection",
      label: "Collection",
      type: "text",
      default: "users"
    },
    {
      key: "filter",
      label: "Filter JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "projection",
      label: "Projection JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "sort",
      label: "Sort JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "limit",
      label: "Limit",
      type: "number",
      default: 50
    }
  ],
  "mongo-insert": [
    {
      key: "collection",
      label: "Collection",
      type: "text",
      default: "users"
    },
    {
      key: "document",
      label: "Document JSON",
      type: "text",
      default: "{}"
    }
  ],
  "mongo-update": [
    {
      key: "collection",
      label: "Collection",
      type: "text",
      default: "users"
    },
    {
      key: "filter",
      label: "Filter JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "update",
      label: "Update JSON",
      type: "text",
      default: "{}"
    },
    {
      key: "upsert",
      label: "Upsert",
      type: "checkbox",
      default: false
    },
    {
      key: "allowCollectionWideUpdate",
      label: "Allow Collection-wide Update",
      type: "checkbox",
      default: false
    }
  ],
  "mongo-delete": [
    {
      key: "collection",
      label: "Collection",
      type: "text",
      default: "users"
    },
    {
      key: "filter",
      label: "Filter JSON",
      type: "text",
      default: "{}"
    }
  ],
  "file-operations": [
    { key: "provider", label: "Storage Provider", type: "select", options: ["Local", "S3", "GCS"], default: "Local" },
    { key: "operation", label: "Operation", type: "select", options: ["Read", "Write", "Delete"], default: "Read" },
    { key: "filePath", label: "File Path", type: "text", default: "./data.txt" }
  ],

  // --- CONTROL FLOW ---
  "condition": [
  {
    key: "expression",
    label: "Expression",
    type: "text",
    default: "true"
  }
],
  "loop": [
    { key: "arrayPath", label: "Array to Iterate", type: "text", default: "{{input.items}}" },
    { key: "mode", label: "Output Mode", type: "select", options: ["Aggregate", "Fire-and-Forget"], default: "Aggregate" }
  ],
  "switch": [
    { key: "rules", label: "Rules (JSON)", type: "text", default: "[]" },
    { key: "defaultBranch", label: "Default Branch", type: "text", default: "Default" }
  ],
  "delay": [
    { key: "amount", label: "Delay Amount", type: "number", default: 5 },
    { key: "timeUnit", label: "Time Unit", type: "select", options: ["Milliseconds", "Seconds", "Minutes", "Hours"], default: "Seconds" }
  ],
  "error-catch": [
    { key: "targetNodes", label: "Listen to Nodes (comma separated)", type: "text", default: "all" }
  ],
  "merge": [
    { key: "mode", label: "Merge Mode", type: "select", options: ["Wait for all", "Pass first"], default: "Wait for all" }
  ],

  // --- DATA INTEGRATION ---
 "external-api-call": [
  {
    key: "url",
    label: "URL",
    type: "text",
    default: ""
  },
  {
    key: "method",
    label: "Method",
    type: "select",
    options: ["GET", "POST", "PUT", "DELETE"],
    default: "GET"
  },
  {
    key: "headers",
    label: "Headers JSON",
    type: "text",
    default: "{}"
  },
  {
    key: "body",
    label: "Body JSON",
    type: "text",
    default: "{}"
  }
],
 "data-transformer": [
  {
    key: "code",
    label: "Transform Code",
    type: "text",
    default: "return input;"
  }
],
  "custom-script": [
    { key: "language", label: "Language", type: "select", options: ["JavaScript", "Python"], default: "JavaScript" }
  ],

  // --- AI & ML ---
 "llm-prompt": [
  {
    key: "provider",
    label: "Provider",
    type: "select",
    options: ["openai", "gemini", "anthropic"],
    default: "openai"
  },
  {
    key: "model",
    label: "Model",
    type: "text",
    default: ""
  },
  {
    key: "prompt",
    label: "Prompt",
    type: "text",
    default: ""
  }
],
  "model-inference": [
    { key: "endpoint", label: "Endpoint", type: "text", default: "https://api.huggingface.co/models/..." },
    { key: "modelId", label: "Model ID", type: "text", default: "" }
  ],
  "text-processing": [
  {
    key: "operation",
    label: "Operation",
    type: "select",
    options: ["uppercase", "lowercase", "extract"],
    default: "uppercase"
  },
  {
    key: "text",
    label: "Text",
    type: "text",
    default: ""
  }
],

  // --- MISC / CORE ---
  "payment-check": [
    { key: "provider", label: "Payment Provider", type: "select", options: ["Stripe", "PayPal"], default: "Stripe" }
  ],
  "email-send": [
    {
      key: "to",
      label: "To Email",
      type: "text",
      default: ""
    },
    {
      key: "subject",
      label: "Subject",
      type: "text",
      default: ""
    },
    {
      key: "message",
      label: "Message",
      type: "text",
      default: ""
    }
  ]
};

export const nodeDefaultCode = {
  "webhook-trigger": "function execute(input, context) {\n  // Access incoming webhook payload\n  return { ...input, received: true };\n}",
  "http-request": "function execute(input, context) {\n  // Pre-process HTTP request data\n  return input;\n}",
  "schedule": "function execute(input, context) {\n  return { scheduledTime: new Date().toISOString() };\n}",
  "event-listener": "function execute(input, context) {\n  return { eventData: input };\n}",
  "db-query": "function execute(input, context) {\n  // Filter or map query results\n  return input.results || [];\n}",
  "db-insert": "function execute(input, context) {\n  // Prepare data payload for insertion\n  return input;\n}",
  "db-delete": "function execute(input, context) {\n  return input;\n}",
  "db-update": "function execute(input, context) {\n  return input;\n}",
  "mongo-find": "function execute(input, context) {\n  // Return all matching documents by default\n  return input.documents || [];\n}",
  "mongo-insert": "function execute(input, context) {\n  return input;\n}",
  "mongo-update": "function execute(input, context) {\n  return input;\n}",
  "mongo-delete": "function execute(input, context) {\n  return input;\n}",
  "file-operations": "function execute(input, context) {\n  return input;\n}",
  "condition": "function execute(input, context) {\n  // Return a branch name like 'True' or 'False'\n  return input.value === true ? 'True' : 'False';\n}",
  "loop": "function execute(input, context) {\n  // Process current loop item\n  return { ...input, processed: true };\n}",
  "switch": "function execute(input, context) {\n  // Return the name of the branch to route to\n  return 'Default';\n}",
  "delay": "function execute(input, context) {\n  return input;\n}",
  "error-catch": "function execute(input, context) {\n  // Handle caught errors gracefully\n  return { resolved: true, error: input.error };\n}",
  "merge": "function execute(input, context) {\n  // Combine data from multiple branches\n  return input.inputs;\n}",
  "external-api-call": "function execute(input, context) {\n  // Parse external API response\n  return input.data;\n}",
  "data-transformer": "function execute(input, context) {\n  // Custom data manipulation\n  return Object.keys(input).reduce((acc, key) => {\n    acc[key.toUpperCase()] = input[key];\n    return acc;\n  }, {});\n}",
  "custom-script": "function execute(input, context) {\n  // Write your complete custom logic here\n  console.log('Running custom script', input);\n  return { status: 'success', data: input };\n}",
  "llm-prompt": "function execute(input, context) {\n  // Extract text from LLM response\n  return { generatedText: input.text };\n}",
  "model-inference": "function execute(input, context) {\n  return input.prediction;\n}",
  "text-processing": "function execute(input, context) {\n  return { summary: input.result };\n}",
  "payment-check": "function execute(input, context) {\n  return input;\n}",
  "email-send": "function execute(input, context) {\n  // Customize email body dynamically\n  return input;\n}",
  "default": "function execute(input, context) {\n  return {\n    ...input,\n    processedAt: new Date().toISOString()\n  };\n}"
};
