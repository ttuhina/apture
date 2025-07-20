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
    } else if (role === 'provider') {
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

// 🔍 Client Search (NEW - for provider appointments page)
app.get('/api/clients/search', async (req, res) => {
  const query = `%${req.query.query}%`;
  try {
    const [rows] = await db.query(`
      SELECT id, name, email
      FROM users
      WHERE role = 'client'
        AND (name LIKE ? OR email LIKE ?)
    `, [query, query]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error searching clients' });
  }
});

// 📆 Provider Availability (existing)
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

// 📆 Client Availability (NEW - for provider appointments page)
app.get('/api/clients/:userId/availability', async (req, res) => {
  try {
    // Get provider's availability based on user_id
    const [providerRows] = await db.query('SELECT id FROM providers WHERE user_id = ?', [req.params.userId]);
    if (!providerRows.length) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    const providerId = providerRows[0].id;
    const [rows] = await db.query(
      `SELECT * FROM availability WHERE provider_id = ?`, [providerId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch availability' });
  }
});

// 📅 Set Provider Availability (NEW)
app.post('/api/provider-availability', async (req, res) => {
  const { provider_user_id, days, start, end, bs, be } = req.body;
  
  try {
    // Get provider ID from user ID
    const [providerRows] = await db.query('SELECT id FROM providers WHERE user_id = ?', [provider_user_id]);
    if (!providerRows.length) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    
    const providerId = providerRows[0].id;
    
    // Delete existing availability for this provider
    await db.query('DELETE FROM availability WHERE provider_id = ?', [providerId]);
    
    // Insert new availability for each selected day
    for (const day of days) {
      await db.query(`
        INSERT INTO availability (provider_id, day_of_week, start_time, end_time, break_start, break_end)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [providerId, day, start, end, bs, be]);
    }
    
    res.json({ message: 'Availability saved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save availability' });
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

// 📋 Get Appointment Requests for Provider (NEW)
app.get('/api/appointment-requests/provider/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const [rows] = await db.query(`
      SELECT ar.id, ar.requested_date, ar.requested_time, ar.status, ar.created_at,
             u.name AS client_name, u.email AS client_email
      FROM appointment_requests ar
      JOIN users u ON ar.client_id = u.id
      JOIN providers p ON ar.provider_id = p.id
      WHERE p.user_id = ? AND ar.status = 'pending'
      ORDER BY ar.created_at DESC
    `, [userId]);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch appointment requests' });
  }
});

// 📤 Respond to Appointment Request (NEW)
app.post('/api/appointment-requests/respond', async (req, res) => {
  const { id, approve } = req.body;
  
  try {
    if (approve) {
      // Get request details
      const [requestRows] = await db.query(`
        SELECT client_id, provider_id, requested_date, requested_time
        FROM appointment_requests
        WHERE id = ?
      `, [id]);
      
      if (!requestRows.length) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      const request = requestRows[0];
      
      // Create appointment
      await db.query(`
        INSERT INTO appointments (client_id, provider_id, appointment_date, appointment_time, status, created_at)
        VALUES (?, ?, ?, ?, 'booked', NOW())
      `, [request.client_id, request.provider_id, request.requested_date, request.requested_time]);
      
      // Update request status
      await db.query(`
        UPDATE appointment_requests SET status = 'approved' WHERE id = ?
      `, [id]);
      
      res.json({ message: 'Appointment approved and booked' });
    } else {
      // Reject request
      await db.query(`
        UPDATE appointment_requests SET status = 'rejected' WHERE id = ?
      `, [id]);
      
      res.json({ message: 'Appointment request rejected' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to respond to request' });
  }
});



// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));