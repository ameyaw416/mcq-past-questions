// create questions table
import pool from '../config/db.js';

// Function to create Questions Table
export async function createQuestionsTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Questions_Table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paper_id INT NOT NULL REFERENCES Paper_Table(id) ON DELETE CASCADE,
    question_number INT NOT NULL,  -- 1, 2, 3...
    stem TEXT NOT NULL,
    explanation TEXT,              -- optional explanation for review
    topic VARCHAR(255),
    difficulty VARCHAR(20),        -- 'easy','medium','hard' if you want
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (paper_id, question_number)

    );
    `;
    try {
        await pool.query(queryText);
        console.log("Questions Table created or already exists.");
        }
    catch (err) {
        console.error("Error creating Questions Table:", err);
    }
};
