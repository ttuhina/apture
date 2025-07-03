const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Serve static files (HTML, CSS, JS) from frontend/
app.use(express.static(path.join(__dirname, 'frontend')));

// ✅ Serve client dashboard as homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'client_dashboard.html'));
});

// ✅ Optional: Add an example API to confirm it’s running
app.get('/ping', (req, res) => {
  res.send('pong!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
