// create topics table
import pool from '../config/db.js';

export async function createTopicsTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Topics_Table (
      id SERIAL PRIMARY KEY,
      subject_id INT NOT NULL REFERENCES Subject_Table(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(50),
      description TEXT,
      UNIQUE (subject_id, name),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Topics Table created or already exists.');
  } catch (err) {
    console.error('Error creating Topics Table:', err);
  }
}
