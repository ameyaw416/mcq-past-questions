// create attempt answers table
import pool from '../config/db.js';

export async function createAttemptAnswersTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Attempt_Answers_Table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      attempt_id UUID NOT NULL REFERENCES Quiz_Attempt_Table(id) ON DELETE CASCADE,
      question_id UUID NOT NULL REFERENCES Questions_Table(id) ON DELETE CASCADE,
      selected_option_id UUID REFERENCES Answer_Options_Table(id) ON DELETE SET NULL,
      is_correct BOOLEAN,
      answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (attempt_id, question_id)
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Attempt Answers Table created or already exists.');
  } catch (err) {
    console.error('Error creating Attempt Answers Table:', err);
  }
}
