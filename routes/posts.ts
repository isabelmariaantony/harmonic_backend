import express, { Request, Response } from 'express';
import { pool } from '../db';
import { User } from '../types/user';

const router = express.Router();

// Get all posts
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.username, u.avatar_url 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const userId = user?.id;
    const { title, content, category } = req.body;

    const result = await pool.query(
      'INSERT INTO posts (user_id, title, content, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, title, content, category]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.*, u.username, u.avatar_url 
       FROM posts p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const userId = user?.id;
    const { title, content, category } = req.body;

    // Check if user owns the post
    const postCheck = await pool.query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      'UPDATE posts SET title = $1, content = $2, category = $3 WHERE id = $4 RETURNING *',
      [title, content, category, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as User | undefined;
    const userId = user?.id;

    // Check if user owns the post
    const postCheck = await pool.query(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (postCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM posts WHERE id = $1', [id]);

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 