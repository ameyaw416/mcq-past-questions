// create import errors table
import pool from '../config/db.js';

export async function createImportErrorsTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Import_Errors_Table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      import_id UUID NOT NULL REFERENCES Imports_Table(id) ON DELETE CASCADE,
      row_number INT,
      column_name VARCHAR(100),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Import Errors Table created or already exists.');
  } catch (err) {
    console.error('Error creating Import Errors Table:', err);
  }
}
