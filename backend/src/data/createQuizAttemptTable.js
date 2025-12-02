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
    expires_at TIMESTAMP,
    score INT,            -- correct answers count
    total_questions INT,
    percent NUMERIC(5,2)


    );
    `;
    try {
    await pool.query(queryText);
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'quiz_attempt_table' AND column_name = 'expires_at'
        ) THEN
          ALTER TABLE Quiz_Attempt_Table ADD COLUMN expires_at TIMESTAMP;
        END IF;
      END $$;
    `);
        console.log("Quiz Attempt Table created or already exists.");
        }
    catch (err) {
        console.error("Error creating Quiz Attempt Table:", err);
    }
};
