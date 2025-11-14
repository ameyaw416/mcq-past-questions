// create paper table
import pool from '../config/db.js';

// Function to create Paper Table
export async function createPaperTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Paper_Table (
    id SERIAL PRIMARY KEY,
    subject_id INT NOT NULL REFERENCES Subject_Table(id) ON DELETE CASCADE,
    year SMALLINT NOT NULL,       -- 2015, 2016...
    paper_number SMALLINT NOT NULL, -- 1, 2, etc
    description TEXT,
    UNIQUE (subject_id, year, paper_number),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );
    `;
    try {
        await pool.query(queryText);
        console.log("Paper Table created or already exists.");
        }
    catch (err) {
        console.error("Error creating Paper Table:", err);
    }
};
