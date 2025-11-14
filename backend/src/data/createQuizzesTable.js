// create quizzes table
import pool from '../config/db.js';

// Function to create Quizzes Table
export async function createQuizzesTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Quizzes_Table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES Users(id),
    exam_type_id INT REFERENCES Exam_Type_Table(id),
    subject_id INT REFERENCES Subject_Table(id),
    year SMALLINT,
    num_questions INT NOT NULL,
    config JSONB, -- extra flags (shuffle, timer, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP


    );
    `;
    try {
        await pool.query(queryText);
        console.log("Quizzes Table created or already exists.");
        }
    catch (err) {
        console.error("Error creating Quizzes Table:", err);
    }
};
