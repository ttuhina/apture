const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// 🔐 Login Route
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = users[0];
    if (user.role !== role) return res.status(403).json({ message: 'Role mismatch' });

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return res.status(401).json({ message: 'Invalid password' });

    // ✅ Valid login
    res.json({ message: 'Login successful', userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
