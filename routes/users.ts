import express, { Request, Response } from 'express';
import { pool } from '../db';
import { User } from '../types/user';

const router = express.Router();

// Get user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const userId = user?.id;

    const result = await pool.query(
      'SELECT id, email, username, bio, avatar_url FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const userId = user?.id;
    const { username, bio, avatar_url } = req.body;

    const result = await pool.query(
      'UPDATE users SET username = $1, bio = $2, avatar_url = $3 WHERE id = $4 RETURNING id, email, username, bio, avatar_url',
      [username, bio, avatar_url, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT id, email, username, bio, avatar_url FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 