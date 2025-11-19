// creating express server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import pool from './backend/src/config/db.js';
import bcrypt from 'bcrypt';
import { createUsersTable} from './backend/src/data/createUsersTable.js';
import { createExamTypeTable } from './backend/src/data/createExamTypeTable.js';
import { createSubjectTable } from './backend/src/data/createSubjectTable.js';
import { createPaperTable } from './backend/src/data/createPaperTable.js';
import { createQuestionsTable } from './backend/src/data/createQuestionsTable.js';
import { createAnswerOptionsTable } from './backend/src/data/createAnswerOptionsTable.js';
import { createQuizAttemptTable } from './backend/src/data/createQuizAttemptTable.js';
import { createQuizzesTable } from './backend/src/data/createQuizzesTable.js';
import { createTopicsTable } from './backend/src/data/createTopicsTable.js';
import { createQuestionTopicsTable } from './backend/src/data/createQuestionTopicsTable.js';
import { createAttemptAnswersTable } from './backend/src/data/createAttemptAnswersTable.js';
import { createImportsTable } from './backend/src/data/createImportsTable.js';
import { createImportErrorsTable } from './backend/src/data/createImportErrorsTable.js';
import authRoutes from './backend/src/routes/authRoute.js';
import verifyAuth from './backend/src/middlewares/authMiddleware.js';
import cookieParser from 'cookie-parser';

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

async function ensureInitialAdmin() {
  const rawEmails = process.env.ADMIN_EMAILS || '';
  const adminEmails = rawEmails
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
  const adminEmail = adminEmails[0];
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_USERNAME || 'Administrator';
  const adminRole = process.env.ADMIN_ROLE || 'admin';
  const resetOnBoot = (process.env.ADMIN_RESET_ON_BOOT || '').toLowerCase() === 'true';

  if (!adminEmail || !adminPassword) {
    console.warn('Initial admin not configured. Skipping admin bootstrap.');
    return;
  }

  if (resetOnBoot) {
    await pool.query(`DELETE FROM Users WHERE role = 'admin'`);
  }

  const existingAdmin = await pool.query(`SELECT id FROM Users WHERE role = 'admin' LIMIT 1`);
  if (existingAdmin.rowCount) {
    console.log('Admin user already exists. Skipping bootstrap.');
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);
  await pool.query(
    `INSERT INTO Users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)`,
    [adminName, adminEmail, passwordHash, adminRole],
  );
  console.log(`Initial admin user created for ${adminEmail}.`);
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());




//routes
app.use('/api/auth', authRoutes);


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
    await createTopicsTable();
    await createPaperTable();
    await createQuestionsTable();
    await createAnswerOptionsTable();
    await createQuestionTopicsTable();
    await createQuizAttemptTable();
    await createAttemptAnswersTable();
    await createQuizzesTable();
    await createImportsTable();
    await createImportErrorsTable();
    await ensureInitialAdmin();


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
