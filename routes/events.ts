import express, { Request, Response } from 'express';
import { pool } from '../db';
import { User } from '../types/user';

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const { category, type, search } = req.query;
    let query = `
      SELECT e.*, u.username as organizer_name 
      FROM events e 
      JOIN users u ON e.organizer_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND e.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (type) {
      query += ` AND e.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (search) {
      query += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY e.date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new event
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const organizerId = user?.id;
    const {
      title,
      description,
      date,
      location,
      type,
      category,
      max_participants,
      registration_deadline
    } = req.body;

    const result = await pool.query(
      `INSERT INTO events (
        organizer_id, title, description, date, location, 
        type, category, max_participants, registration_deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        organizerId,
        title,
        description,
        date,
        location,
        type,
        category,
        max_participants,
        registration_deadline
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT e.*, u.username as organizer_name 
       FROM events e 
       JOIN users u ON e.organizer_id = u.id 
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const organizerId = user?.id;
    const {
      title,
      description,
      date,
      location,
      type,
      category,
      max_participants,
      registration_deadline
    } = req.body;

    // Check if user is the organizer
    const eventCheck = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND organizer_id = $2',
      [id, organizerId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE events SET 
        title = $1, description = $2, date = $3, location = $4,
        type = $5, category = $6, max_participants = $7, registration_deadline = $8
       WHERE id = $9 RETURNING *`,
      [
        title,
        description,
        date,
        location,
        type,
        category,
        max_participants,
        registration_deadline,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const organizerId = user?.id;

    // Check if user is the organizer
    const eventCheck = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND organizer_id = $2',
      [id, organizerId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for event
router.post('/:id/register', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const userId = user?.id;

    // Check if event exists and is not full
    const eventCheck = await pool.query(
      `SELECT * FROM events e 
       LEFT JOIN (
         SELECT event_id, COUNT(*) as participant_count 
         FROM event_registrations 
         GROUP BY event_id
       ) r ON e.id = r.event_id
       WHERE e.id = $1 AND (r.participant_count < e.max_participants OR e.max_participants IS NULL)`,
      [id]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Event is full or does not exist' });
    }

    // Check if user is already registered
    const registrationCheck = await pool.query(
      'SELECT * FROM event_registrations WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (registrationCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const result = await pool.query(
      'INSERT INTO event_registrations (event_id, user_id) VALUES ($1, $2) RETURNING *',
      [id, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 