const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const { executeInSandbox } = require("./sandbox.service");
const { OpenAI } = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require("@anthropic-ai/sdk");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const nodeRegistry = {
  // --- CORE ---
  "webhook-trigger": async (config, context) => {
    console.log("Webhook triggered");
    return context.input;
  },

  "payment-check": async (config, context) => {
    console.log("Checking payment (Simulated Flag)...");
    const isPaid = config?.simulatedFlag !== false;
    await delay(500);
    return { verified: isPaid };
  },

  "email-send": async (config, context) => {
    try {
      console.log("Sending email...");
      let activeTransporter = transporter;

      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "#") {
        console.log("No real email credentials found, generating Ethereal test account...");
        const testAccount = await nodemailer.createTestAccount();
        activeTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass }
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_USER && process.env.EMAIL_USER !== "#" ? process.env.EMAIL_USER : '"NexusFlow Engine" <test@ethereal.email>',
        to: context?.input?.email || config?.to || process.env.EMAIL_USER || "user@example.com",
        subject: config?.subject || "NexusFlow Workflow Email 🚀",
        text: config?.message || `Hello ${context?.input?.name || "User"},\n\nYour workflow executed successfully 🚀`
      };

      const info = await activeTransporter.sendMail(mailOptions);
      console.log("Email sent successfully:", info.messageId);
      
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "#") {
        console.log("📧 Preview your test email here: " + nodemailer.getTestMessageUrl(info));
      }

      return { success: true, receiver: mailOptions.to };
    } catch (error) {
      console.error("EMAIL ERROR:", error);
      throw error;
    }
  },

  "condition": async (config, context) => {
    console.log("Evaluating condition...");
    const expression = config?.expression || "false";
    const code = `
      function execute(input, context) {
        return !!(${expression});
      }
    `;
    const result = await executeInSandbox(code, context.input, context);
    console.log("Condition result:", result ? "True" : "False");
    return result ? "True" : "False";
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
    if (!config?.collection) throw new Error("Collection name is required for db-query");
    console.log(`Executing DB Query on ${config.collection}...`);
    const collection = mongoose.connection.db.collection(config.collection);
    const query = typeof config?.query === 'string' ? JSON.parse(config.query) : (config?.query || {});
    const results = await collection.find(query).toArray();
    return { results, count: results.length };
  },
  "db-insert": async (config, context) => {
    if (!config?.collection) throw new Error("Collection name is required for db-insert");
    console.log(`Executing DB Insert into ${config.collection}...`);
    const collection = mongoose.connection.db.collection(config.collection);
    const data = typeof config?.data === 'string' ? JSON.parse(config.data) : (config?.data || context.input || {});
    const result = await collection.insertOne(data);
    return { insertedId: result.insertedId, success: result.acknowledged };
  },
  "db-update": async (config, context) => {
    if (!config?.collection) throw new Error("Collection name is required for db-update");
    console.log(`Executing DB Update on ${config.collection}...`);
    const collection = mongoose.connection.db.collection(config.collection);
    const filter = typeof config?.filter === 'string' ? JSON.parse(config.filter) : (config?.filter || {});
    const updateDoc = typeof config?.update === 'string' ? JSON.parse(config.update) : (config?.update || {});
    const result = await collection.updateMany(filter, updateDoc);
    return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, success: result.acknowledged };
  },
  "db-delete": async (config, context) => {
    if (!config?.collection) throw new Error("Collection name is required for db-delete");
    console.log(`Executing DB Delete on ${config.collection}...`);
    const collection = mongoose.connection.db.collection(config.collection);
    const filter = typeof config?.filter === 'string' ? JSON.parse(config.filter) : (config?.filter || {});
    const result = await collection.deleteMany(filter);
    return { deletedCount: result.deletedCount, success: result.acknowledged };
  },
  "file-operations": async (config, context) => {
    console.log(`Executing File Operation (${config?.operation || 'read'})...`);
    const path = config?.filePath;
    if (!path) throw new Error("File path is required");

    switch(config?.operation) {
      case 'write':
        const writeData = config?.content || (typeof context.input === 'string' ? context.input : JSON.stringify(context.input));
        await fs.writeFile(path, writeData);
        return { success: true };
      case 'append':
        await fs.appendFile(path, config?.content || '');
        return { success: true };
      case 'delete':
        await fs.unlink(path);
        return { success: true };
      case 'read':
      default:
        return { fileData: await fs.readFile(path, 'utf8') };
    }
  },

  // --- CONTROL FLOW ---
  "loop": async (config, context) => {
    console.log("Executing Loop...");
    const items = config?.items || context.input;
    if (!Array.isArray(items)) throw new Error("Loop input must be an array");
    return { items, count: items.length };
  },
  "switch": async (config, context) => {
    console.log("Executing Switch...");
    const code = `
      function execute(input, context) {
        ${config?.code || 'return "Default";'}
      }
    `;
    return await executeInSandbox(code, context.input, context);
  },
  "delay": async (config, context) => {
    const amount = parseInt(config?.amount || 1, 10);
    const ms = config?.timeUnit === "Minutes" ? amount * 60000 : amount * 1000;
    console.log(`Delaying for ${ms} ms...`);
    await delay(ms);
    return { delayedMs: ms };
  },
  "error-catch": async (config, context) => {
    console.log("Executing Error Catch...");
    return { handled: true };
  },
  "merge": async (config, context) => {
    console.log("Executing Merge...");
    return { merged: true, data: context.input };
  },

  // --- DATA INTEGRATION ---
  "external-api-call": async (config, context) => {
    const url = config?.url;
    if (!url) throw new Error("URL is required");
    console.log(`Calling external API: ${url}...`);
    
    const options = {
      method: config?.method || 'GET',
      headers: typeof config?.headers === 'string' ? JSON.parse(config.headers) : (config?.headers || {}),
    };
    if (config?.body && (options.method !== 'GET' && options.method !== 'HEAD')) {
      options.body = typeof config?.body === 'string' ? config.body : JSON.stringify(config.body);
    }
    
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      let data = text;
      try { data = JSON.parse(text); } catch(e) {} // parse json if possible
      return { status: response.status, data };
    } catch (err) {
      throw new Error(`API Call Failed: ${err.message}`);
    }
  },
  "data-transformer": async (config, context) => {
    console.log("Executing Data Transformer...");
    const code = `
      function execute(input, context) {
        ${config?.code || 'return input;'}
      }
    `;
    return await executeInSandbox(code, context.input, context);
  },
  "custom-script": async (config, context) => {
    console.log("Executing Custom Script...");
    const code = config?.code || 'function execute(input, context) { return input; }';
    return await executeInSandbox(code, context.input, context);
  },

  // --- AI & ML ---
  "llm-prompt": async (config, context) => {
    console.log("Executing LLM Prompt...");
    const prompt = config?.prompt || "Hello";
    const provider = config?.provider || "openai";
    const model = config?.model;

    if (provider === "openai") {
      if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is missing in .env");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: model || "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      });
      return { text: response.choices[0].message.content, usage: response.usage };
    } 
    else if (provider === "gemini") {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing in .env");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const aiModel = genAI.getGenerativeModel({ model: model || "gemini-pro" });
      const result = await aiModel.generateContent(prompt);
      return { text: result.response.text() };
    } 
    else if (provider === "anthropic") {
      if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is missing in .env");
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const msg = await anthropic.messages.create({
        model: model || "claude-3-haiku-20240307",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      });
      return { text: msg.content[0].text, usage: msg.usage };
    }
    
    throw new Error(`Unsupported AI provider: ${provider}`);
  },
  "model-inference": async (config, context) => {
    // This could also connect to HuggingFace or similar API in the future
    console.log("Executing Model Inference (Placeholder for external inference API)...");
    return { prediction: "completed", data: context.input };
  },
  "text-processing": async (config, context) => {
    console.log(`Executing Text Processing (${config?.operation || 'uppercase'})...`);
    const text = config?.text || context.input?.text || (typeof context.input === 'string' ? context.input : "");
    if (!text) return { result: "" };

    switch(config?.operation) {
      case 'uppercase': return { result: text.toUpperCase() };
      case 'lowercase': return { result: text.toLowerCase() };
      case 'extract': 
        const regex = new RegExp(config?.regex || ".*");
        const match = text.match(regex);
        return { result: match ? match[0] : null, matches: match };
      default:
        return { result: text };
    }
  }
};

module.exports = nodeRegistry;
