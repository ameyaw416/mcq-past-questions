import pool from '../config/db.js';

export async function ensureQuizAttemptExtras() {
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
}
