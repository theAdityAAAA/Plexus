const nodemailer = require("nodemailer");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const nodeRegistry = {
  "webhook-trigger": async (config, context) => {
  console.log("Webhook triggered");

  console.log("Incoming webhook data:");
  console.log(context.input);

  return context.input;
},

  "payment-check": async () => {
    console.log("Checking payment...");
    await delay(1000);
    console.log("Payment verified.");
  },

  "db-update": async () => {
    console.log("Updating database...");
    await delay(1200);
    console.log("Database updated.");
  },

//   "email-send": async (config) => {
//     console.log("Sending real email...");

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: config?.to || process.env.EMAIL_USER,  // fallback to yourself
//       subject: config?.subject || "Workflow Email",
//       text: config?.message || "This email was sent from your workflow engine 🚀"
//     };

//     await transporter.sendMail(mailOptions);

//     console.log("Email sent successfully.");
//   }




// "email-send": async (config) => {
//   try {
//     console.log("Sending real email...");
//     console.log("Config:", config);
//     console.log("EMAIL_USER:", process.env.EMAIL_USER);
//     console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: config?.to || process.env.EMAIL_USER,
//       subject: config?.subject || "Workflow Email",
//       text: config?.message || "Test email"
//     };

//     const info = await transporter.sendMail(mailOptions);

//     console.log("Email sent successfully:", info.response);

//   } catch (error) {
//     console.error("EMAIL ERROR:", error);
//     throw error;
//   }
// },
"email-send": async (config, context) => {
  try {
    console.log("Sending real email...");

    console.log("Webhook Input:");
    console.log(context.input);

    let activeTransporter = transporter;

    // Use Ethereal fake SMTP if real credentials aren't provided
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "#") {
      console.log("No real email credentials found, generating Ethereal test account...");
      const testAccount = await nodemailer.createTestAccount();
      activeTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER && process.env.EMAIL_USER !== "#" ? process.env.EMAIL_USER : '"NexusFlow Engine" <test@ethereal.email>',

      // ✅ Receiver from webhook payload
      to:
        context?.input?.email ||
        config?.to ||
        process.env.EMAIL_USER ||
        "user@example.com",

      subject:
        config?.subject ||
        "NexusFlow Workflow Email 🚀",

      text:
        config?.message ||
        `Hello ${
          context?.input?.name || "User"
        },\n\nYour workflow executed successfully 🚀`
    };

    console.log("Sending TO:", mailOptions.to);

    const info = await activeTransporter.sendMail(mailOptions);

    console.log("Email sent successfully:", info.messageId);
    
    // Log preview URL if using Ethereal
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "#") {
      console.log("📧 Preview your test email here: " + nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      receiver: mailOptions.to
    };

  } catch (error) {
    console.error(
      "EMAIL ERROR:",
      error
    );

    throw error;
  }
},

  "condition": async (config) => {
  console.log("Evaluating condition...");

  // Simulate decision
  const result = Math.random() > 0.5 ? "True" : "False";

  console.log("Condition result:", result);

  return result;
  },

  // --- TRIGGERS ---
  "http-request": async (config, context) => {
    console.log("Executing HTTP Request Trigger...");
    return context.input;
  },
  "schedule": async (config, context) => {
    console.log("Executing Schedule Trigger...");
    return { timestamp: new Date().toISOString() };
  },
  "event-listener": async (config, context) => {
    console.log("Executing Event Listener Trigger...");
    return context.input;
  },

  // --- DATABASE & STORAGE ---
  "db-query": async (config, context) => {
    console.log(`Executing DB Query on ${config?.tableName || 'unknown'}...`);
    await delay(500);
    return { results: [{ id: 1, mockData: "Hello" }], count: 1 };
  },
  "db-insert": async (config, context) => {
    console.log(`Executing DB Insert into ${config?.tableName || 'unknown'}...`);
    await delay(500);
    return { insertedId: "mock-id-123", success: true };
  },
  "db-delete": async (config, context) => {
    console.log(`Executing DB Delete on ${config?.tableName || 'unknown'}...`);
    await delay(500);
    return { deletedCount: 1, success: true };
  },
  "file-operations": async (config, context) => {
    console.log(`Executing File Operation (${config?.operation || 'Read'})...`);
    await delay(300);
    return { status: "success", fileData: "mock-file-content" };
  },

  // --- CONTROL FLOW ---
  "loop": async (config, context) => {
    console.log("Executing Loop...");
    return { items: [1, 2, 3], currentItem: 1 };
  },
  "switch": async (config, context) => {
    console.log("Executing Switch...");
    return config?.defaultBranch || "Default";
  },
  "delay": async (config, context) => {
    const amount = parseInt(config?.amount || 1, 10);
    const ms = config?.timeUnit === "Seconds" ? amount * 1000 : amount;
    console.log(`Delaying for ${ms} ms...`);
    await delay(ms);
    return { delayedMs: ms };
  },
  "error-catch": async (config, context) => {
    console.log("Executing Error Catch...");
    return { caughtError: "Mock Error Message" };
  },
  "merge": async (config, context) => {
    console.log("Executing Merge...");
    return { merged: true, data: context.input };
  },

  // --- DATA INTEGRATION ---
  "external-api-call": async (config, context) => {
    console.log(`Calling external API: ${config?.url || 'unknown'}...`);
    try {
      const response = await fetch(config?.url || 'https://jsonplaceholder.typicode.com/todos/1');
      const data = await response.json();
      return { status: response.status, data };
    } catch (err) {
      return { error: err.message };
    }
  },
  "data-transformer": async (config, context) => {
    console.log("Executing Data Transformer...");
    return { ...context.input, transformed: true };
  },
  "custom-script": async (config, context) => {
    console.log("Executing Custom Script...");
    return { scriptOutput: "Success" }; 
  },

  // --- AI & ML ---
  "llm-prompt": async (config, context) => {
    console.log("Executing LLM Prompt...");
    await delay(1000);
    return { text: "This is a mock LLM response based on the prompt.", usage: { tokens: 42 } };
  },
  "model-inference": async (config, context) => {
    console.log("Executing Model Inference...");
    await delay(1000);
    return { prediction: "mock-prediction-result", confidence: 0.95 };
  },
  "text-processing": async (config, context) => {
    console.log(`Executing Text Processing (${config?.operation || 'Summarize'})...`);
    return { result: "Mock processed text result" };
  }
};

module.exports = nodeRegistry;
