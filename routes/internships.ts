import express, { Request, Response } from 'express';
import { pool } from '../db';
import { User } from '../types/user';

const router = express.Router();

// Get all internships
router.get('/', async (req, res) => {
  try {
    const { category, type, organization_type, is_volunteer, search } = req.query;
    let query = `
      SELECT i.*, u.username as posted_by 
      FROM internships i 
      JOIN users u ON i.posted_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (category) {
      query += ` AND i.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (type) {
      query += ` AND i.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    if (organization_type) {
      query += ` AND i.organization_type = $${paramCount}`;
      params.push(organization_type);
      paramCount++;
    }

    if (is_volunteer !== undefined) {
      query += ` AND i.is_volunteer = $${paramCount}`;
      params.push(is_volunteer === 'true');
      paramCount++;
    }

    if (search) {
      query += ` AND (
        i.title ILIKE $${paramCount} OR 
        i.description ILIKE $${paramCount} OR 
        i.company ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY i.deadline ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new internship
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as User | undefined;
    const postedBy = user?.id;
    const {
      title,
      company,
      description,
      requirements,
      location,
      type,
      duration,
      stipend,
      deadline,
      category,
      application_url,
      is_volunteer,
      organization_type
    } = req.body;

    const result = await pool.query(
      `INSERT INTO internships (
        posted_by, title, company, description, requirements,
        location, type, duration, stipend, deadline,
        category, application_url, is_volunteer, organization_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        postedBy,
        title,
        company,
        description,
        requirements,
        location,
        type,
        duration,
        stipend,
        deadline,
        category,
        application_url,
        is_volunteer,
        organization_type
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get internship by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, u.username as posted_by 
       FROM internships i 
       JOIN users u ON i.posted_by = u.id 
       WHERE i.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Internship not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update internship
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const postedBy = req.user?.id;
    const {
      title,
      company,
      description,
      requirements,
      location,
      type,
      duration,
      stipend,
      deadline,
      category,
      application_url,
      is_volunteer,
      organization_type
    } = req.body;

    // Check if user is the poster
    const internshipCheck = await pool.query(
      'SELECT * FROM internships WHERE id = $1 AND posted_by = $2',
      [id, postedBy]
    );

    if (internshipCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await pool.query(
      `UPDATE internships SET 
        title = $1, company = $2, description = $3, requirements = $4,
        location = $5, type = $6, duration = $7, stipend = $8,
        deadline = $9, category = $10, application_url = $11,
        is_volunteer = $12, organization_type = $13
       WHERE id = $14 RETURNING *`,
      [
        title,
        company,
        description,
        requirements,
        location,
        type,
        duration,
        stipend,
        deadline,
        category,
        application_url,
        is_volunteer,
        organization_type,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete internship
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const postedBy = req.user?.id;

    // Check if user is the poster
    const internshipCheck = await pool.query(
      'SELECT * FROM internships WHERE id = $1 AND posted_by = $2',
      [id, postedBy]
    );

    if (internshipCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await pool.query('DELETE FROM internships WHERE id = $1', [id]);

    res.json({ message: 'Internship deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 