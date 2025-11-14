// create quiz attempt table
import pool from '../config/db.js';

// Function to create Quiz Attempt Table
export async function createQuizAttemptTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Quiz_Attempt_Table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
    exam_type_id INT REFERENCES Exam_Type_Table(id),
    subject_id INT REFERENCES Subject_Table(id),
    paper_id INT REFERENCES Paper_Table(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    score INT,            -- correct answers count
    total_questions INT,
    percent NUMERIC(5,2)


    );
    `;
    try {
        await pool.query(queryText);
        console.log("Quiz Attempt Table created or already exists.");
        }
    catch (err) {
        console.error("Error creating Quiz Attempt Table:", err);
    }
};
