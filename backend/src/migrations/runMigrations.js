import pool from '../config/db.js';
import { createUsersTable } from '../data/createUsersTable.js';
import { createExamTypeTable } from '../data/createExamTypeTable.js';
import { createSubjectTable } from '../data/createSubjectTable.js';
import { createTopicsTable } from '../data/createTopicsTable.js';
import { createPaperTable } from '../data/createPaperTable.js';
import { createQuestionsTable } from '../data/createQuestionsTable.js';
import { createAnswerOptionsTable } from '../data/createAnswerOptionsTable.js';
import { createQuestionTopicsTable } from '../data/createQuestionTopicsTable.js';
import { createQuizAttemptTable } from '../data/createQuizAttemptTable.js';
import { createAttemptAnswersTable } from '../data/createAttemptAnswersTable.js';
import { createQuizzesTable } from '../data/createQuizzesTable.js';
import { createImportsTable } from '../data/createImportsTable.js';
import { createImportErrorsTable } from '../data/createImportErrorsTable.js';

const migrations = [
  {
    id: '000_enable_pgcrypto',
    run: () => pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";'),
  },
  { id: '001_create_users_table', run: createUsersTable },
  { id: '002_create_exam_type_table', run: createExamTypeTable },
  { id: '003_create_subject_table', run: createSubjectTable },
  { id: '004_create_topics_table', run: createTopicsTable },
  { id: '005_create_paper_table', run: createPaperTable },
  { id: '006_create_questions_table', run: createQuestionsTable },
  { id: '007_create_answer_options_table', run: createAnswerOptionsTable },
  { id: '008_create_question_topics_table', run: createQuestionTopicsTable },
  { id: '009_create_quiz_attempt_table', run: createQuizAttemptTable },
  { id: '010_create_attempt_answers_table', run: createAttemptAnswersTable },
  { id: '011_create_quizzes_table', run: createQuizzesTable },
  { id: '012_create_imports_table', run: createImportsTable },
  { id: '013_create_import_errors_table', run: createImportErrorsTable },
];

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
};

const getAppliedMigrations = async () => {
  const result = await pool.query('SELECT id FROM schema_migrations');
  return new Set(result.rows.map((row) => row.id));
};

const markMigrationApplied = (id) =>
  pool.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);

export async function runMigrations() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  for (const migration of migrations) {
    if (applied.has(migration.id)) {
      continue;
    }

    console.log(`Running migration ${migration.id}...`);
    await migration.run();
    await markMigrationApplied(migration.id);
    console.log(`Migration ${migration.id} applied.`);
  }

  console.log('All migrations applied.');
}
