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

    res.json({ message: 'Login successful', userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📅 Fetch appointments for client or provider
app.get('/api/appointments/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query;

  try {
    let rows;

    if (role === 'client') {
      // Fetch appointments for the client
      [rows] = await db.query(
        `SELECT a.appointment_date, a.appointment_time, p.specialization
         FROM appointments a
         JOIN providers p ON a.provider_id = p.id
         WHERE a.client_id = ? AND a.status = 'booked'
         ORDER BY a.appointment_date, a.appointment_time`,
        [userId]
      );
    } else if (role === 'provider') {
      // Fetch appointments for the provider by mapping user_id to provider_id
      [rows] = await db.query(
        `SELECT a.appointment_date, a.appointment_time, u.name AS client_name
         FROM appointments a
         JOIN users u ON a.client_id = u.id
         WHERE a.provider_id = (
           SELECT id FROM providers WHERE user_id = ?
         ) AND a.status = 'booked'
         ORDER BY a.appointment_date, a.appointment_time`,
        [userId]
      );
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// ✍️ Signup Route
app.post('/api/signup', async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const [userResult] = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, email, phone, hashed, role]
    );
    const userId = userResult.insertId;

    if (role === 'provider') {
      await db.query(
        `INSERT INTO providers (user_id, category, specialization, location, bio, rating)
         VALUES (?, 'Salon', 'Hair & Skin', 'Mumbai', 'Experienced beauty expert', 4.9)`,
        [userId]
      );
    }

    res.status(201).json({ message: 'Signup successful', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
