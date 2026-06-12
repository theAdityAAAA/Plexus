console.log("VARIABLE RESOLVER FILE LOADED");

function getValueByPath(obj, path) {
  return path
    .split(/\.|\[|\]/)
    .filter(Boolean)
    .reduce((acc, key) => {
      if (acc === undefined || acc === null) {
        return undefined;
      }

      return acc[key];
    }, obj);
}

function resolveString(str, context) {
  return str.replace(
    /\{\{(.*?)\}\}/g,
    (_, expression) => {
      const value = getValueByPath(
        context.outputs,
        expression.trim()
      );

      return value !== undefined
        ? String(value)
        : "";
    }
  );
}

function resolveVariables(config, context) {
  if (typeof config === "string") {
    return resolveString(config, context);
  }

  if (Array.isArray(config)) {
    return config.map(item =>
      resolveVariables(item, context)
    );
  }

  if (config && typeof config === "object") {
    const resolved = {};

    for (const key in config) {
      resolved[key] = resolveVariables(
        config[key],
        context
      );
    }

    return resolved;
  }

  return config;
}

module.exports = {
  resolveVariables
};