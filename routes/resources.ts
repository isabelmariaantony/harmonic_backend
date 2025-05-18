import express, { Request, Response } from 'express';
import { pool } from '../db';
import { User } from '../types/user';

const router = express.Router();

// Get all resources with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, type, difficulty, search } = req.query as {
      category?: string;
      type?: string;
      difficulty?: string;
      search?: string;
    };
    let query = `
      SELECT r.*, u.username as author_name 
      FROM resources r 
      JOIN users u ON r.author_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND r.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (type) {
      query += ` AND r.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (difficulty) {
      query += ` AND r.difficulty = $${paramCount}`;
      params.push(difficulty);
      paramCount++;
    }

    if (search) {
      query += ` AND (
        r.title ILIKE $${paramCount} OR 
        r.description ILIKE $${paramCount} OR 
        r.tags ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY r.date_added DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new resource
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const authorId = user?.id;
    const {
      title,
      description,
      category,
      type,
      difficulty,
      url,
      tags
    } = req.body as {
      title?: string;
      description?: string;
      category?: string;
      type?: string;
      difficulty?: string;
      url?: string;
      tags?: string[];
    };

    const result = await pool.query(
      `INSERT INTO resources (
        author_id, title, description, category,
        type, difficulty, url, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        authorId,
        title,
        description,
        category,
        type,
        difficulty,
        url,
        tags
      ]
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
      `SELECT r.*, u.username as author_name 
       FROM resources r 
       JOIN users u ON r.author_id = u.id 
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

// Update resource
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id?: string };
    const user = req.user as User | undefined;
    const authorId = user?.id;
    const {
      title,
      description,
      category,
      type,
      difficulty,
      url,
      tags
    } = req.body as {
      title?: string;
      description?: string;
      category?: string;
      type?: string;
      difficulty?: string;
      url?: string;
      tags?: string[];
    };

    // Check if user is the author
    const resourceCheck = await pool.query(
      'SELECT * FROM resources WHERE id = $1 AND author_id = $2',
      [id, authorId]
    );

    if (resourceCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE resources SET 
        title = $1, description = $2, category = $3,
        type = $4, difficulty = $5, url = $6, tags = $7
       WHERE id = $8 RETURNING *`,
      [
        title,
        description,
        category,
        type,
        difficulty,
        url,
        tags,
        id
      ]
    );

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
    const authorId = user?.id;

    // Check if user is the author
    const resourceCheck = await pool.query(
      'SELECT * FROM resources WHERE id = $1 AND author_id = $2',
      [id, authorId]
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