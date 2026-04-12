const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');

// POST /api/rooms — create a new room
// Returns the new room's ID so the frontend can redirect to /room/:id
router.post('/', async (req, res) => {
  try {
    const { name, language = 'javascript' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Room name must be under 100 characters' });
    }

    const id = uuidv4(); // e.g. "550e8400-e29b-41d4-a716-446655440000"

    const result = await pool.query(
      `INSERT INTO rooms (id, name, language, code)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name.trim(), language, '']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating room:', err.message);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/rooms/:id — fetch an existing room by ID
// Used when someone opens a shared link
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM rooms WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching room:', err.message);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// PATCH /api/rooms/:id — update the code snapshot in the DB
// Called periodically to persist the latest code
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, language } = req.body;

    const result = await pool.query(
      `UPDATE rooms 
       SET code = COALESCE($1, code),
           language = COALESCE($2, language),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [code, language, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating room:', err.message);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

module.exports = router;