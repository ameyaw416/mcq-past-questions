// create answer options table
import pool from '../config/db.js';

// Function to create Answer Options Table
export async function createAnswerOptionsTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Answer_Options_Table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES Questions_Table(id) ON DELETE CASCADE,
    label VARCHAR(5) NOT NULL,    -- 'A', 'B', 'C', 'D'
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (question_id, label),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    

    );
    `;
    try {
        await pool.query(queryText);
        console.log("Answer Options Table created or already exists.");
        }
    catch (err) {
        console.error("Error creating Answer Options Table:", err);
    }
};
