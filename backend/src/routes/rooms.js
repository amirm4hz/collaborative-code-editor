const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');

// POST /api/rooms — create a new room + default first file
router.post('/', async (req, res) => {
  try {
    const { name, language = 'javascript' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Room name must be under 100 characters' });
    }

    const roomId = uuidv4();
    const fileId = uuidv4();

    // Create the room
    await pool.query(
      `INSERT INTO rooms (id, name, language, code) VALUES ($1, $2, $3, $4)`,
      [roomId, name.trim(), language, '']
    );

    // Create the default first file
    await pool.query(
      `INSERT INTO files (id, room_id, name, language, code) VALUES ($1, $2, $3, $4, $5)`,
      [fileId, roomId, 'main.js', language, '']
    );

    const room = await pool.query('SELECT * FROM rooms WHERE id = $1', [roomId]);
    const files = await pool.query('SELECT * FROM files WHERE room_id = $1 ORDER BY created_at ASC', [roomId]);

    res.status(201).json({
      ...room.rows[0],
      files: files.rows,
      activeFileId: fileId,
    });
  } catch (err) {
    console.error('Error creating room:', err.message);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// GET /api/rooms/:id — fetch room + all its files
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const roomResult = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const filesResult = await pool.query(
      'SELECT * FROM files WHERE room_id = $1 ORDER BY created_at ASC',
      [id]
    );

    let files = filesResult.rows;

    // If room has no files yet (old room), create a default one
    if (files.length === 0) {
      const fileId = uuidv4();
      await pool.query(
        `INSERT INTO files (id, room_id, name, language, code) VALUES ($1, $2, $3, $4, $5)`,
        [fileId, id, 'main.js', roomResult.rows[0].language || 'javascript', roomResult.rows[0].code || '']
      );
      const newFiles = await pool.query('SELECT * FROM files WHERE room_id = $1', [id]);
      files = newFiles.rows;
    }

    res.json({
      ...roomResult.rows[0],
      files,
      activeFileId: files[0].id,
    });
  } catch (err) {
    console.error('Error fetching room:', err.message);
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

// POST /api/rooms/:id/files — create a new file in a room
router.post('/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, language = 'javascript' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'File name is required' });
    }

    // Check room exists
    const room = await pool.query('SELECT id FROM rooms WHERE id = $1', [id]);
    if (room.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Max 10 files per room
    const count = await pool.query('SELECT COUNT(*) FROM files WHERE room_id = $1', [id]);
    if (parseInt(count.rows[0].count) >= 10) {
      return res.status(400).json({ error: 'Maximum 10 files per room' });
    }

    const fileId = uuidv4();
    await pool.query(
      `INSERT INTO files (id, room_id, name, language, code) VALUES ($1, $2, $3, $4, $5)`,
      [fileId, id, name.trim(), language, '']
    );

    const file = await pool.query('SELECT * FROM files WHERE id = $1', [fileId]);
    res.status(201).json(file.rows[0]);
  } catch (err) {
    console.error('Error creating file:', err.message);
    res.status(500).json({ error: 'Failed to create file' });
  }
});

// PATCH /api/rooms/:id/files/:fileId — update file code/language
router.patch('/:id/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { code, language, name } = req.body;

    const result = await pool.query(
      `UPDATE files
       SET code = COALESCE($1, code),
           language = COALESCE($2, language),
           name = COALESCE($3, name),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [code, language, name, fileId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating file:', err.message);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// DELETE /api/rooms/:id/files/:fileId — delete a file
router.delete('/:id/files/:fileId', async (req, res) => {
  try {
    const { id, fileId } = req.params;

    // Can't delete if it's the last file
    const count = await pool.query('SELECT COUNT(*) FROM files WHERE room_id = $1', [id]);
    if (parseInt(count.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last file' });
    }

    await pool.query('DELETE FROM files WHERE id = $1 AND room_id = $2', [fileId, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting file:', err.message);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;