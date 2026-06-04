const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Catch-all route for any method and any path
app.use((req, res) => {
  console.log('\n--- 🚀 New Incoming Request ---');
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  if (Object.keys(req.query).length > 0) {
    console.log('Query Parameters:', req.query);
  }
  
  if (Object.keys(req.body).length > 0) {
    console.log('Body Data:', req.body);
  }
  
  if (req.headers['authorization']) {
    console.log('Auth Header:', req.headers['authorization']);
  }
  
  console.log('-------------------------------\n');

  // Respond with a dummy success message
  res.status(200).json({
    success: true,
    message: 'Test server received the request successfully!',
    receivedData: req.body
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`\n✅ Dummy Webhook Test Server is running on http://localhost:${PORT}`);
  console.log(`Use this URL in your workflow nodes (e.g. Webhook Trigger) to test them!`);
});
