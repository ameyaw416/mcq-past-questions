// create subject table
import pool from '../config/db.js';

// Function to create Subject Table
export async function createSubjectTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Subject_Table (
    id SERIAL PRIMARY KEY,
    exam_type_id INT NOT NULL REFERENCES Exam_Type_Table(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL, -- 'MATH', 'ENG', etc.
    UNIQUE (exam_type_id, code),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );
    `;
    try {
        await pool.query(queryText);
        console.log("Subject Table created or already exists.");
        }
    catch (err) {
        console.error("Error creating Subject Table:", err);
    }
};
