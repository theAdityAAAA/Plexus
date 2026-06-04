const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const connectDB = require("./config/db");
const {
  plexusMiddleware
} = require("plexus-sdk");
const app = express();

app.use(cors());
app.use(express.json());
app.use(
  plexusMiddleware()
);

connectDB();

const workflowRoutes = require("./routes/workflow.routes");
app.use("/api/workflows", workflowRoutes);

app.get("/", (req, res) => {
  res.send("Server is working 🚀");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 🔥 VERY IMPORTANT
app.set("io", io);

server.listen(5005, () => {
  console.log("Server running on port 5005");
});
