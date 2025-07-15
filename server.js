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

// Serve Login Page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// 🔐 Login
app.post('/api/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(401).json({ message: 'User not found' });

    const user = users[0];
    if (user.role !== role) return res.status(403).json({ message: 'Role mismatch' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid password' });

    res.json({ message: 'Login successful', userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✍️ Signup
app.post('/api/signup', async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      `INSERT INTO users (name, email, phone, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, email, phone, hashed, role]
    );
    const userId = result.insertId;

    if (role === 'provider') {
      await db.query(
        `INSERT INTO providers (user_id, category, specialization, location, bio, rating, working_hours)
         VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL)`,
        [userId]
      );
    }

    res.status(201).json({ message: 'Signup successful', userId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 📅 Appointments for client/provider
app.get('/api/appointments/:userId', async (req, res) => {
  const { userId } = req.params;
  const { role } = req.query;

  try {
    let rows;
    if (role === 'client') {
  [rows] = await db.query(`
    SELECT a.appointment_date, a.appointment_time, u.name AS provider_name, p.specialization
    FROM appointments a
    JOIN providers p ON a.provider_id = p.id
    JOIN users u ON p.user_id = u.id
    WHERE a.client_id = ? AND a.status = 'booked'
    ORDER BY a.appointment_date, a.appointment_time
  `, [userId]);
}
 else if (role === 'provider') {
      [rows] = await db.query(`
        SELECT a.appointment_date, a.appointment_time, u.name AS client_name
        FROM appointments a
        JOIN users u ON a.client_id = u.id
        WHERE a.provider_id = (SELECT id FROM providers WHERE user_id = ?)
        AND a.status = 'booked'
        ORDER BY a.appointment_date, a.appointment_time
      `, [userId]);
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch appointments' });
  }
});

// 👤 Full user info (for profile dialog)
app.get('/api/user/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT name, email, phone FROM users WHERE id = ?`, [req.params.userId]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// ✏️ Update client profile
app.put('/api/user/:userId', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    await db.query(`
      UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?
    `, [name, email, phone, req.params.userId]);

    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update client profile' });
  }
});

// 🧾 Get Provider Profile
app.get('/api/provider-profile/:userId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.name, p.specialization, p.location, p.bio, p.working_hours
      FROM users u
      JOIN providers p ON u.id = p.user_id
      WHERE u.id = ?
    `, [req.params.userId]);

    if (!rows.length) return res.status(404).json({ message: 'Provider not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// ✏️ Update Provider Profile
app.put('/api/provider-profile/:userId', async (req, res) => {
  const { name, specialization, location, bio, working_hours } = req.body;
  const { userId } = req.params;

  try {
    await db.query(`UPDATE users SET name = ? WHERE id = ?`, [name, userId]);
    await db.query(`
      UPDATE providers SET specialization = ?, location = ?, bio = ?, working_hours = ?
      WHERE user_id = ?`,
      [specialization, location, bio, working_hours, userId]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// 🔍 Provider Search
app.get('/api/providers/search', async (req, res) => {
  const query = `%${req.query.query}%`;
  try {
    const [rows] = await db.query(`
      SELECT u.id AS user_id, u.name, u.email, p.specialization
      FROM users u
      JOIN providers p ON u.id = p.user_id
      WHERE u.role = 'provider'
        AND (u.name LIKE ? OR u.email LIKE ? OR p.specialization LIKE ?)
    `, [query, query, query]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error searching providers' });
  }
});

// 📆 Availability
app.get('/api/providers/:userId/availability', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM availability WHERE provider_id = ?`, [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
});

// 📩 Appointment Requests
app.post('/api/appointment-requests', async (req, res) => {
  const { client_id, provider_id: userProvidedProviderId, requested_date, requested_time } = req.body;

  try {
    // Get actual provider.id using user_id
    const [rows] = await db.query(`SELECT id FROM providers WHERE user_id = ?`, [userProvidedProviderId]);
    if (!rows.length) return res.status(400).json({ message: 'Provider not found' });

    const provider_id = rows[0].id;

    await db.query(`
      INSERT INTO appointment_requests (client_id, provider_id, requested_date, requested_time, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', NOW())
    `, [client_id, provider_id, requested_date, requested_time]);

    res.status(201).json({ message: 'Appointment request sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to request appointment' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
