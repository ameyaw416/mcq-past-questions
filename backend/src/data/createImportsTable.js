// create imports table
import pool from '../config/db.js';

export async function createImportsTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Imports_Table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES Users(id) ON DELETE SET NULL,
      source VARCHAR(255),
      original_filename VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      total_rows INT,
      processed_rows INT,
      successful_rows INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Imports Table created or already exists.');
  } catch (err) {
    console.error('Error creating Imports Table:', err);
  }
}
