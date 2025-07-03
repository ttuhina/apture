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
  console.log('Plain password:', password);
  console.log('Hashed from DB:', user.password_hash);

});
// Get appointments for a client
app.get('/api/appointments/:clientId', async (req, res) => {
  const clientId = req.params.clientId;

  try {
    const [rows] = await db.query(
      `SELECT a.appointment_date, a.appointment_time, p.specialization 
       FROM appointments a
       JOIN providers p ON a.provider_id = p.id
       WHERE a.client_id = ? AND a.status = 'booked'
       ORDER BY a.appointment_date, a.appointment_time`,
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
app.post('/api/signup', async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    // Check if email already exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert into DB
    const [result] = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, email, phone, hashed, role]
    );

    // Return userId
    res.status(201).json({ message: 'Signup successful', userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
