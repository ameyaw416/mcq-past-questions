// creating users table
import pool from '../config/db.js';

// Function to create Exam Type Table
export async function createExamTypeTable() {
  const queryText = `
    CREATE TABLE IF NOT EXISTS Exam_Type_Table (
    id SERIAL PRIMARY KEY,
     code VARCHAR(20) UNIQUE NOT NULL, -- 'BECE', 'WASSCE'
     name VARCHAR(100) NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP


    );
  `;

  try {
    await pool.query(queryText);
    console.log("Exam Type Table created or already exists.");
  } catch (err) {
    console.error("Error creating Exam Type Table:", err);
  }
};


