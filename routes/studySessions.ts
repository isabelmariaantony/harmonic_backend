import express, { Request, Response } from 'express';
import { pool } from '../db';
import { User } from '../types/user';

const router = express.Router();

// Get all study sessions
router.get('/', async (req, res) => {
  try {
    const { subject, type, search } = req.query;
    let query = `
      SELECT s.*, u.username as host_name 
      FROM study_sessions s 
      JOIN users u ON s.host_id = u.id
      WHERE s.date >= CURRENT_DATE
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (subject) {
      query += ` AND s.subject = $${paramCount}`;
      params.push(subject);
      paramCount++;
    }

    if (type) {
      query += ` AND s.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        s.title ILIKE $${paramCount} OR 
        s.description ILIKE $${paramCount} OR 
        s.subject ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY s.date ASC, s.start_time ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new study session
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const hostId = user?.id;
    const {
      title,
      description,
      subject,
      date,
      start_time,
      end_time,
      location,
      type,
      max_participants
    } = req.body;

    const result = await pool.query(
      `INSERT INTO study_sessions (
        host_id, title, description, subject,
        date, start_time, end_time, location,
        type, max_participants
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        hostId,
        title,
        description,
        subject,
        date,
        start_time,
        end_time,
        location,
        type,
        max_participants
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get study session by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT s.*, u.username as host_name 
       FROM study_sessions s 
       JOIN users u ON s.host_id = u.id 
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update study session
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const hostId = user?.id;
    const {
      title,
      description,
      subject,
      date,
      start_time,
      end_time,
      location,
      type,
      max_participants
    } = req.body;

    // Check if user is the host
    const sessionCheck = await pool.query(
      'SELECT * FROM study_sessions WHERE id = $1 AND host_id = $2',
      [id, hostId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE study_sessions SET 
        title = $1, description = $2, subject = $3,
        date = $4, start_time = $5, end_time = $6,
        location = $7, type = $8, max_participants = $9
       WHERE id = $10 RETURNING *`,
      [
        title,
        description,
        subject,
        date,
        start_time,
        end_time,
        location,
        type,
        max_participants,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete study session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const hostId = user?.id;

    // Check if user is the host
    const sessionCheck = await pool.query(
      'SELECT * FROM study_sessions WHERE id = $1 AND host_id = $2',
      [id, hostId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM study_sessions WHERE id = $1', [id]);

    res.json({ message: 'Study session deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Join study session
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const userId = user?.id;

    // Check if session exists and is not full
    const sessionCheck = await pool.query(
      `SELECT * FROM study_sessions s 
       LEFT JOIN (
         SELECT session_id, COUNT(*) as participant_count 
         FROM session_participants 
         GROUP BY session_id
       ) p ON s.id = p.session_id
       WHERE s.id = $1 AND (p.participant_count < s.max_participants OR s.max_participants IS NULL)`,
      [id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Session is full or does not exist' });
    }

    // Check if user is already a participant
    const participantCheck = await pool.query(
      'SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (participantCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Already joined this session' });
    }

    const result = await pool.query(
      'INSERT INTO session_participants (session_id, user_id) VALUES ($1, $2) RETURNING *',
      [id, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave study session
router.delete('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const userId = user?.id;

    const result = await pool.query(
      'DELETE FROM session_participants WHERE session_id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Not a participant in this session' });
    }

    res.json({ message: 'Left study session' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 