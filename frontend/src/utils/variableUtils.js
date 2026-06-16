const TEMPLATE_RE = /\{\{(.*?)\}\}/g;

export function getTypeLabel(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

export function getValueByPath(source, path) {
  if (!path) return undefined;

  return path
    .split(/\.|\[|\]/)
    .filter(Boolean)
    .reduce((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[key];
    }, source);
}

export function buildOutputNamespace(nodes = [], nodeExecutionData = {}) {
  return nodes.reduce((namespace, node) => {
    const output = nodeExecutionData[node.id]?.output;

    if (output === undefined) {
      return namespace;
    }

    const alias = node.data?.alias?.trim();
    const key = alias || node.id;

    namespace[key] = output;
    return namespace;
  }, {});
}

function makeNode(label, path, value, children = []) {
  return {
    id: path,
    label,
    path,
    value,
    type: getTypeLabel(value),
    children
  };
}

function buildChildren(value, basePath, depth) {
  if (depth > 8 || value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item, index) => {
      const path = `${basePath}[${index}]`;
      return makeNode(`[${index}]`, path, item, buildChildren(item, path, depth + 1));
    });
  }

  if (typeof value === "object") {
    return Object.keys(value).map((key) => {
      const path = `${basePath}.${key}`;
      return makeNode(key, path, value[key], buildChildren(value[key], path, depth + 1));
    });
  }

  return [];
}

export function buildVariableTree(namespace = {}) {
  return Object.keys(namespace).map((key) =>
    makeNode(key, key, namespace[key], buildChildren(namespace[key], key, 1))
  );
}

function flattenNode(node, result) {
  result.push({
    path: node.path,
    label: node.label,
    type: node.type,
    value: node.value,
    hasChildren: node.children.length > 0
  });

  node.children.forEach((child) => flattenNode(child, result));
}

export function flattenVariableTree(tree = []) {
  const result = [];
  tree.forEach((node) => flattenNode(node, result));
  return result;
}

export function getVariableExpression(path) {
  return `{{${path}}}`;
}

export function resolveTemplate(template, namespace = {}) {
  if (typeof template !== "string" || !template.includes("{{")) {
    return { value: template, missing: [] };
  }

  const missing = [];
  const value = template.replace(TEMPLATE_RE, (_, expression) => {
    const path = expression.trim();
    const resolved = getValueByPath(namespace, path);

    if (resolved === undefined) {
      missing.push(path);
      return "Variable not available";
    }

    if (typeof resolved === "object") {
      return JSON.stringify(resolved);
    }

    return String(resolved);
  });

  return { value, missing };
}

export function validateTemplate(template, namespace = {}) {
  if (typeof template !== "string") return [];

  const invalid = [];
  const seen = new Set();
  let match;

  TEMPLATE_RE.lastIndex = 0;

  while ((match = TEMPLATE_RE.exec(template)) !== null) {
    const path = match[1].trim();

    if (!path || seen.has(path)) continue;
    seen.add(path);

    if (getValueByPath(namespace, path) === undefined) {
      invalid.push(path);
    }
  }

  return invalid;
}
