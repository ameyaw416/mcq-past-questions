// create question topics table
import pool from '../config/db.js';

export async function createQuestionTopicsTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Question_Topics_Table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id UUID NOT NULL REFERENCES Questions_Table(id) ON DELETE CASCADE,
      topic_id INT NOT NULL REFERENCES Topics_Table(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (question_id, topic_id)
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Question Topics Table created or already exists.');
  } catch (err) {
    console.error('Error creating Question Topics Table:', err);
  }
}
