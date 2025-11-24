import pool from '../config/db.js';

const db = (client) => client || pool;

export const selectQuestions = (client) =>
  db(client)
    .query(
      `SELECT q.id,
              q.paper_id,
              q.question_number,
              q.stem,
              q.explanation,
              q.topic,
              q.difficulty,
              q.created_at,
              p.subject_id,
              p.year,
              p.paper_number
         FROM Questions_Table q
         LEFT JOIN Paper_Table p ON p.id = q.paper_id
         ORDER BY q.created_at DESC`,
    )
    .then((result) => result.rows);

export const selectQuestionById = (id, client) =>
  db(client)
    .query(
      `SELECT q.id,
              q.paper_id,
              q.question_number,
              q.stem,
              q.explanation,
              q.topic,
              q.difficulty,
              q.created_at,
              p.subject_id,
              p.year,
              p.paper_number
         FROM Questions_Table q
         LEFT JOIN Paper_Table p ON p.id = q.paper_id
        WHERE q.id = $1`,
      [id],
    )
    .then((result) => result.rows[0] || null);

export const insertQuestionRecord = (
  { paperId, questionNumber, stem, explanation, topic, difficulty },
  client,
) =>
  db(client)
    .query(
      `INSERT INTO Questions_Table (paper_id, question_number, stem, explanation, topic, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, paper_id, question_number, stem, explanation, topic, difficulty, created_at`,
      [paperId, questionNumber, stem, explanation || null, topic || null, difficulty || null],
    )
    .then((result) => result.rows[0]);

export const updateQuestionRecord = (
  id,
  { paperId, questionNumber, stem, explanation, topic, difficulty },
  client,
) =>
  db(client)
    .query(
      `UPDATE Questions_Table
          SET paper_id = $2,
              question_number = $3,
              stem = $4,
              explanation = $5,
              topic = $6,
              difficulty = $7
        WHERE id = $1
        RETURNING id, paper_id, question_number, stem, explanation, topic, difficulty, created_at`,
      [id, paperId, questionNumber, stem, explanation || null, topic || null, difficulty || null],
    )
    .then((result) => result.rows[0] || null);

export const deleteQuestionRecord = (id, client) =>
  db(client)
    .query('DELETE FROM Questions_Table WHERE id = $1 RETURNING id', [id])
    .then((result) => result.rows[0] || null);

export const selectOptionsForQuestions = (questionIds, client) =>
  db(client)
    .query(
      `SELECT id, question_id, label, text, is_correct, created_at
         FROM Answer_Options_Table
        WHERE question_id = ANY($1::uuid[])
        ORDER BY label ASC`,
      [questionIds],
    )
    .then((result) => result.rows);

export const selectTopicsForQuestions = (questionIds, client) =>
  db(client)
    .query(
      `SELECT qt.question_id,
              t.id AS topic_id,
              t.name
         FROM Question_Topics_Table qt
         JOIN Topics_Table t ON t.id = qt.topic_id
        WHERE qt.question_id = ANY($1::uuid[])
        ORDER BY t.name ASC`,
      [questionIds],
    )
    .then((result) => result.rows);

export const deleteOptionsByQuestion = (questionId, client) =>
  db(client).query('DELETE FROM Answer_Options_Table WHERE question_id = $1', [questionId]);

export const deleteQuestionTopics = (questionId, client) =>
  db(client).query('DELETE FROM Question_Topics_Table WHERE question_id = $1', [questionId]);

export const insertQuestionOption = ({ questionId, label, text, isCorrect }, client) =>
  db(client)
    .query(
      `INSERT INTO Answer_Options_Table (question_id, label, text, is_correct)
       VALUES ($1, $2, $3, $4)
       RETURNING id, question_id, label, text, is_correct, created_at`,
      [questionId, label, text, Boolean(isCorrect)],
    )
    .then((result) => result.rows[0]);

export const insertQuestionTopic = ({ questionId, topicId }, client) =>
  db(client)
    .query(
      `INSERT INTO Question_Topics_Table (question_id, topic_id)
       VALUES ($1, $2)
       ON CONFLICT (question_id, topic_id) DO NOTHING
       RETURNING id, question_id, topic_id`,
      [questionId, topicId],
    )
    .then((result) => result.rows[0] || null);
