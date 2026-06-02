const vm = require("vm");

exports.executeInSandbox = async (code, input, context) => {
  return new Promise((resolve, reject) => {
    try {
      // Define the restricted environment
      const sandboxEnv = {
        input: JSON.parse(JSON.stringify(input || {})),
        context: JSON.parse(JSON.stringify({
          executionId: context.executionId,
          workflowId: context.workflowId,
          variables: context.variables,
          outputs: context.outputs
        })),
        console: {
          log: (...args) => console.log("[Sandbox Log]:", ...args),
          error: (...args) => console.error("[Sandbox Error]:", ...args),
          warn: (...args) => console.warn("[Sandbox Warn]:", ...args)
        }
      };

      // Wrap the user's code to extract the result of their 'execute' function
      const wrappedCode = `
        ${code}
        if (typeof execute !== "function") {
          throw new Error("Sandbox requires an 'execute(input, context)' function.");
        }
        execute(input, context);
      `;

      // Create secure context
      const sandbox = vm.createContext(sandboxEnv);

      // Execute code with strict limits
      const script = new vm.Script(wrappedCode);
      const result = script.runInContext(sandbox, {
        timeout: 5000, // Max 5 seconds execution
        displayErrors: true
      });

      // Handle async results if the user returned a Promise
      if (result instanceof Promise) {
        result.then(resolve).catch(reject);
      } else {
        resolve(result);
      }
    } catch (error) {
      reject(error);
    }
  });
};
