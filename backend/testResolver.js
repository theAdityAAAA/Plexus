const { resolveVariables } = require("./services/variableResolver.service");

const result = resolveVariables(
  {
    to: "{{custom-script.email}}",
    message: "Hello {{custom-script.name}}"
  },
  {
    outputs: {
      "custom-script": {
        name: "Dora",
        email: "dora@gmail.com"
      }
    }
  }
);

console.log(result);