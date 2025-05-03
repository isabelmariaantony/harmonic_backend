const { pool } = require('../utils/db');

class User {
  static async create({ email, password, name, role, skills, availability }) {
    const query = `
      INSERT INTO users (email, password, name, role, skills, availability)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, name, role, skills, availability, created_at
    `;
    
    const values = [email, password, name, role, skills, availability];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async updateProfile(id, updates) {
    const allowedFields = ['name', 'skills', 'availability', 'bio'];
    const validUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const setClause = Object.keys(validUpdates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const query = `
      UPDATE users
      SET ${setClause}
      WHERE id = $1
      RETURNING id, email, name, role, skills, availability, bio, updated_at
    `;

    const values = [id, ...Object.values(validUpdates)];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = User; 