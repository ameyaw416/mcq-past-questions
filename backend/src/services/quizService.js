import pool from '../config/db.js';
import {
  selectOptionsForQuestions,
  selectTopicsForQuestions,
} from '../models/questionModel.js';

const DEFAULT_QUESTION_COUNT = Number(process.env.QUIZ_DEFAULT_QUESTION_COUNT || 10);
const DEFAULT_DURATION_MINUTES = Number(process.env.QUIZ_DEFAULT_DURATION_MINUTES || 15);

const shuffleArray = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const fetchSubject = async (subjectId) => {
  const result = await pool.query(
    `SELECT id, exam_type_id
       FROM Subject_Table
      WHERE id = $1`,
    [subjectId],
  );
  return result.rows[0] || null;
};

const fetchPaper = async (paperId) => {
  const result = await pool.query(
    `SELECT p.id, p.subject_id, p.year, p.paper_number, s.exam_type_id
       FROM Paper_Table p
       JOIN Subject_Table s ON s.id = p.subject_id
      WHERE p.id = $1`,
    [paperId],
  );
  return result.rows[0] || null;
};

const loadQuestions = async ({ subjectId, paperId, limit }) => {
  const params = [paperId || subjectId, limit];
  const filter = paperId ? 'q.paper_id = $1' : 'p.subject_id = $1';
  const result = await pool.query(
    `SELECT q.id,
            q.paper_id,
            q.question_number,
            q.stem,
            q.explanation,
            q.topic,
            q.difficulty,
            p.year,
            p.paper_number
       FROM Questions_Table q
       JOIN Paper_Table p ON p.id = q.paper_id
      WHERE ${filter}
      ORDER BY RANDOM()
      LIMIT $2`,
    params,
  );
  return result.rows;
};

export const startQuizAttempt = async ({
  userId,
  subjectId,
  paperId,
  numQuestions,
  durationMinutes,
}) => {
  if (!subjectId && !paperId) {
    const error = new Error('subjectId or paperId is required.');
    error.status = 400;
    throw error;
  }

  const totalQuestions = Number(numQuestions) || DEFAULT_QUESTION_COUNT;
  const duration = Number(durationMinutes) || DEFAULT_DURATION_MINUTES;
  if (totalQuestions <= 0) {
    const error = new Error('numQuestions must be greater than zero.');
    error.status = 400;
    throw error;
  }

  if (duration <= 0) {
    const error = new Error('durationMinutes must be greater than zero.');
    error.status = 400;
    throw error;
  }

  let subject = null;

  if (paperId) {
    const paper = await fetchPaper(paperId);
    if (!paper) {
      const error = new Error('Paper not found.');
      error.status = 404;
      throw error;
    }
    subjectId = paper.subject_id;
  }

  subject = await fetchSubject(subjectId);
  if (!subject) {
    const error = new Error('Subject not found.');
    error.status = 404;
    throw error;
  }

  const questions = await loadQuestions({ subjectId, paperId, limit: totalQuestions });
  if (questions.length < totalQuestions) {
    const error = new Error('Not enough questions available for this selection.');
    error.status = 400;
    throw error;
  }

  const questionIds = questions.map((question) => question.id);
  const [optionRows, topicRows] = await Promise.all([
    selectOptionsForQuestions(questionIds),
    selectTopicsForQuestions(questionIds),
  ]);

  const optionMap = new Map();
  optionRows.forEach((row) => {
    if (!optionMap.has(row.question_id)) optionMap.set(row.question_id, []);
    optionMap.get(row.question_id).push({ id: row.id, label: row.label, text: row.text });
  });

  const topicMap = new Map();
  topicRows.forEach((row) => {
    if (!topicMap.has(row.question_id)) topicMap.set(row.question_id, []);
    topicMap.get(row.question_id).push({ id: row.topic_id, name: row.name });
  });

  const expiresAt = new Date(Date.now() + duration * 60 * 1000);
  const client = await pool.connect();
  let attemptRow;

  try {
    await client.query('BEGIN');
    const attemptResult = await client.query(
      `INSERT INTO Quiz_Attempt_Table (user_id, exam_type_id, subject_id, paper_id, total_questions, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, started_at, expires_at`,
      [userId, subject.exam_type_id, subjectId, paperId || null, totalQuestions, expiresAt],
    );
    attemptRow = attemptResult.rows[0];

    for (const questionId of questionIds) {
      await client.query(
        `INSERT INTO Attempt_Answers_Table (attempt_id, question_id)
         VALUES ($1, $2)`,
        [attemptRow.id, questionId],
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const responseQuestions = questions.map((question) => {
    const options = shuffleArray(optionMap.get(question.id) || []);
    return {
      id: question.id,
      question_number: question.question_number,
      stem: question.stem,
      explanation: question.explanation,
      topic: question.topic,
      difficulty: question.difficulty,
      paper: {
        id: question.paper_id,
        year: question.year,
        paper_number: question.paper_number,
      },
      options,
      topics: topicMap.get(question.id) || [],
    };
  });

  return {
    attemptId: attemptRow.id,
    startedAt: attemptRow.started_at,
    expiresAt: attemptRow.expires_at,
    durationMinutes: duration,
    totalQuestions,
    subjectId,
    paperId: paperId || null,
    questions: responseQuestions,
  };
};
