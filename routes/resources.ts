import express, { Request, Response } from 'express';
import { pool } from '../db';
import { User } from '../types/user';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get all approved and visible resources
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name as creator_name 
       FROM resources r 
       LEFT JOIN users u ON r.created_by = u.id 
       WHERE r.is_approved = true AND r.is_hidden = false 
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all resources (for admin/volunteer)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is admin or volunteer
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows[0].role !== 'administrator' && userResult.rows[0].role !== 'volunteer') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `SELECT r.*, 
              u1.name as creator_name,
              u2.name as approver_name
       FROM resources r 
       LEFT JOIN users u1 ON r.created_by = u1.id 
       LEFT JOIN users u2 ON r.approved_by = u2.id 
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new resource
router.post('/', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { title, description, url, type, category, difficulty } = req.body;

    // Check if user is volunteer
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [user.id]
    );

    const isVolunteer = userResult.rows[0].role === 'volunteer';

    const result = await pool.query(
      `INSERT INTO resources 
       (title, description, url, type, category, difficulty, created_by, is_approved) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [title, description, url, type, category || 'general', difficulty || 'beginner', user.id, isVolunteer]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get resource by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id?: string };

    const result = await pool.query(
      `SELECT r.*, u.name as creator_name 
       FROM resources r 
       LEFT JOIN users u ON r.created_by = u.id 
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a resource
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { id } = req.params;
    const { title, description, url, type, category, difficulty } = req.body;

    // Check if user is admin or volunteer
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [user.id]
    );

    const isAdmin = userResult.rows[0].role === 'administrator';
    const isVolunteer = userResult.rows[0].role === 'volunteer';

    // Get the resource
    const resourceResult = await pool.query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );

    if (resourceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const resource = resourceResult.rows[0];

    // Only allow updates if user is admin, volunteer, or the creator
    if (!isAdmin && !isVolunteer && resource.created_by !== user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE resources 
       SET title = $1, 
           description = $2, 
           url = $3, 
           type = $4,
           category = $5,
           difficulty = $6,
           is_approved = CASE 
             WHEN $7 = true THEN true 
             ELSE is_approved 
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 
       RETURNING *`,
      [
        title, 
        description, 
        url, 
        type, 
        category || resource.category, 
        difficulty || resource.difficulty,
        isVolunteer, 
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve a resource (volunteer only)
router.post('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is volunteer
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows[0].role !== 'volunteer') {
      return res.status(403).json({ message: 'Only volunteers can approve resources' });
    }

    const { id } = req.params;

    const result = await pool.query(
      `UPDATE resources 
       SET is_approved = true, 
           approved_by = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 
       RETURNING *`,
      [user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Hide/Unhide a resource (admin only)
router.post('/:id/toggle-visibility', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user is admin
    const userResult = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows[0].role !== 'administrator') {
      return res.status(403).json({ message: 'Only administrators can hide resources' });
    }

    const { id } = req.params;

    const result = await pool.query(
      `UPDATE resources 
       SET is_hidden = NOT is_hidden,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete resource
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id?: string };
    const user = req.user as User | undefined;
    const userId = user?.id;

    // Check if user is the creator
    const resourceCheck = await pool.query(
      'SELECT * FROM resources WHERE id = $1 AND created_by = $2',
      [id, userId]
    );

    if (resourceCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM resources WHERE id = $1', [id]);
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 