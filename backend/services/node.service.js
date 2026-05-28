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

    const mailOptions = {
      from: process.env.EMAIL_USER,

      // ✅ Receiver from webhook payload
      to:
        context?.input?.email ||
        config?.to ||
        process.env.EMAIL_USER,

      subject:
        config?.subject ||
        "NexusFlow Workflow Email 🚀",

      text:
        config?.message ||
        `Hello ${
          context?.input?.name || "User"
        },

Your workflow executed successfully 🚀`
    };

    console.log(
      "Sending TO:",
      mailOptions.to
    );

    const info =
      await transporter.sendMail(
        mailOptions
      );

    console.log(
      "Email sent successfully:",
      info.response
    );

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
  const result = Math.random() > 0.5 ? "success" : "failure";

  console.log("Condition result:", result);

  return result;
}






};

module.exports = nodeRegistry;
