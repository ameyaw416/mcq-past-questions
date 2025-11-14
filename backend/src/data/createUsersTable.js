// creating users table
import pool from '../config/db.js';

// Function to create Users table
export async function createUsersTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student', -- 'student' | 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

    );
  `;

  const ensureIdColumnQuery = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id'
      ) THEN
        ALTER TABLE Users ADD COLUMN id UUID DEFAULT gen_random_uuid();
        UPDATE Users SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE Users ALTER COLUMN id SET NOT NULL;
      END IF;
    END $$;
  `;

  const ensurePrimaryKeyQuery = `
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'users' AND constraint_type = 'PRIMARY KEY'
      ) THEN
        ALTER TABLE Users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
      END IF;
    END $$;
  `;

  try {
    await pool.query(queryText);
    await pool.query(ensureIdColumnQuery);
    await pool.query(ensurePrimaryKeyQuery);
    console.log("Users table created or already exists.");
  } catch (err) {
    console.error("Error creating Users table:", err);
  }
};
