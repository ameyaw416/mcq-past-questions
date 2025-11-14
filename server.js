// creating express server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './backend/src/config/db.js';
import { createUsersTable} from './backend/src/data/createUsersTable.js';
import { createExamTypeTable } from './backend/src/data/createExamTypeTable.js';
import { createSubjectTable } from './backend/src/data/createSubjectTable.js';
import { createPaperTable } from './backend/src/data/createPaperTable.js';
import { createQuestionsTable } from './backend/src/data/createQuestionsTable.js';
import { createAnswerOptionsTable } from './backend/src/data/createAnswerOptionsTable.js';
import { createQuizAttemptTable } from './backend/src/data/createQuizAttemptTable.js';
import { createQuizzesTable } from './backend/src/data/createQuizzesTable.js';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());


//routes


//Error handling middleware



// Initialize database and create tables
// Initialize database and create tables
async function init() {
    
try {
  // Enable pgcrypto extension for UUID generation
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

  // Create tables
    await createUsersTable();
    await createExamTypeTable();
    await createSubjectTable();
    await createPaperTable();
    await createQuestionsTable();
    await createAnswerOptionsTable();
    await createQuizAttemptTable();
    await createQuizzesTable();


  console.log("All tables initialized successfully.");
} catch (err) {
  console.error("Error during database setup:", err);
}



//Server listening
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
}

init();
