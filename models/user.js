const pool = require('../utils/db');

class User {
  static async create({ email, password, name, role, skills, availability }) {
    const query = `
      INSERT INTO users (email, password_hash, name, role, skills, availability, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, name, role, skills, availability, is_approved
    `;
    // Only administrators are automatically approved
    const isApproved = role === 'administrator';
    const values = [email, password, name, role, skills, availability, isApproved];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll(role = null, isApproved = null) {
    let query = 'SELECT id, email, name, role, skills, availability, is_approved FROM users';
    const values = [];
    let conditions = [];

    if (role) {
      conditions.push(`role = $${values.length + 1}`);
      values.push(role);
    }

    if (isApproved !== null) {
      conditions.push(`is_approved = $${values.length + 1}`);
      values.push(isApproved);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async updateApprovalStatus(id, isApproved) {
    const query = 'UPDATE users SET is_approved = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [isApproved, id]);
    return result.rows[0];
  }

  static async updateRole(id, role) {
    const query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [role, id]);
    return result.rows[0];
  }

  static async updateProfile(id, updates) {
    try {
      console.log('Updating user profile:', {
        userId: id,
        updates
      });

      const allowedFields = ['name', 'skills', 'availability'];
      const validUpdates = Object.keys(updates)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          // Handle skills as an array
          if (key === 'skills') {
            obj[key] = updates[key];
          }
          // Handle availability as JSON
          else if (key === 'availability') {
            obj[key] = updates[key];
          }
          // Handle name as is
          else {
            obj[key] = updates[key];
          }
          return obj;
        }, {});

      if (Object.keys(validUpdates).length === 0) {
        throw new Error('No valid fields to update');
      }

      const setClause = Object.keys(validUpdates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');

      const query = `
        UPDATE users
        SET ${setClause}
        WHERE id = $1
        RETURNING id, email, name, role, skills, availability, is_approved, updated_at
      `;

      const values = [id, ...Object.values(validUpdates)];
      const result = await pool.query(query, values);
      
      if (!result.rows[0]) {
        throw new Error('User not found');
      }

      console.log('Profile update successful:', {
        userId: result.rows[0].id,
        updatedFields: Object.keys(validUpdates)
      });

      return result.rows[0];
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  }
}

module.exports = User; 