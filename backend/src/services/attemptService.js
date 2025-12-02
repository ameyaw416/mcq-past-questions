import pool from '../config/db.js';
import {
  selectOptionsForQuestions,
  selectTopicsForQuestions,
} from '../models/questionModel.js';

const ensureOwnedAttempt = (attempt, userId) => {
  if (!attempt) {
    const error = new Error('Attempt not found.');
    error.status = 404;
    throw error;
  }
  if (attempt.user_id !== userId) {
    const error = new Error('You are not allowed to access this attempt.');
    error.status = 403;
    throw error;
  }
};

const fetchAttempt = async (attemptId) => {
  const result = await pool.query(
    `SELECT qa.id,
            qa.user_id,
            qa.started_at,
            qa.completed_at,
            qa.expires_at,
            qa.total_questions,
            qa.score,
            qa.percent,
            qa.subject_id,
            qa.paper_id,
            qa.exam_type_id
       FROM Quiz_Attempt_Table qa
      WHERE qa.id = $1`,
    [attemptId],
  );
  return result.rows[0] || null;
};

const fetchAttemptSummary = async (attemptId) => {
  const result = await pool.query(
    `SELECT qa.id,
            qa.user_id,
            qa.started_at,
            qa.completed_at,
            qa.expires_at,
            qa.total_questions,
            qa.score,
            qa.percent,
            s.name AS subject_name,
            et.name AS exam_level_name,
            p.year,
            p.paper_number
       FROM Quiz_Attempt_Table qa
       LEFT JOIN Subject_Table s ON s.id = qa.subject_id
       LEFT JOIN Exam_Type_Table et ON et.id = qa.exam_type_id
       LEFT JOIN Paper_Table p ON p.id = qa.paper_id
      WHERE qa.id = $1`,
    [attemptId],
  );
  return result.rows[0] || null;
};

const validateAnswers = (answers) => {
  if (!Array.isArray(answers)) {
    const error = new Error('answers must be an array.');
    error.status = 400;
    throw error;
  }
};

export const submitAttemptService = async ({ attemptId, userId, answers }) => {
  validateAnswers(answers);
  const attempt = await fetchAttempt(attemptId);
  ensureOwnedAttempt(attempt, userId);

  if (attempt.completed_at) {
    const error = new Error('Attempt already submitted.');
    error.status = 400;
    throw error;
  }

  if (attempt.expires_at && new Date(attempt.expires_at) < new Date()) {
    const error = new Error('Attempt has expired.');
    error.status = 400;
    throw error;
  }

  const questionRes = await pool.query(
    `SELECT question_id FROM Attempt_Answers_Table WHERE attempt_id = $1`,
    [attemptId],
  );
  const questionIds = questionRes.rows.map((row) => row.question_id);
  if (!questionIds.length) {
    const error = new Error('Attempt has no questions to grade.');
    error.status = 400;
    throw error;
  }

  const answerMap = new Map();
  answers.forEach((entry) => {
    if (entry && entry.questionId && entry.optionId) {
      answerMap.set(String(entry.questionId), String(entry.optionId));
    }
  });

  const optionsResult = await pool.query(
    `SELECT id, question_id, is_correct
       FROM Answer_Options_Table
      WHERE question_id = ANY($1::uuid[])`,
    [questionIds],
  );

  const optionMap = new Map();
  const correctMap = new Map();
  optionsResult.rows.forEach((row) => {
    if (!optionMap.has(row.question_id)) optionMap.set(row.question_id, new Set());
    optionMap.get(row.question_id).add(row.id);
    if (row.is_correct) {
      correctMap.set(row.question_id, row.id);
    }
  });

  answerMap.forEach((optionId, questionId) => {
    const allowed = optionMap.get(questionId);
    if (!allowed || !allowed.has(optionId)) {
      const error = new Error('Invalid option selected for a question.');
      error.status = 400;
      throw error;
    }
  });

  const client = await pool.connect();
  let correctCount = 0;
  try {
    await client.query('BEGIN');
    for (const questionId of questionIds) {
      const selectedOptionId = answerMap.get(String(questionId)) || null;
      const correctOptionId = correctMap.get(questionId) || null;
      const isCorrect = Boolean(selectedOptionId && selectedOptionId === correctOptionId);
      if (isCorrect) correctCount += 1;
      await client.query(
        `UPDATE Attempt_Answers_Table
            SET selected_option_id = $1,
                is_correct = $2,
                answered_at = NOW()
          WHERE attempt_id = $3 AND question_id = $4`,
        [selectedOptionId, isCorrect, attemptId, questionId],
      );
    }

    const percent = attempt.total_questions
      ? Number(((correctCount / attempt.total_questions) * 100).toFixed(2))
      : 0;

    await client.query(
      `UPDATE Quiz_Attempt_Table
          SET completed_at = NOW(),
              score = $2,
              percent = $3
        WHERE id = $1`,
      [attemptId, correctCount, percent],
    );

    await client.query('COMMIT');

    return {
      attemptId,
      score: correctCount,
      totalQuestions: attempt.total_questions,
      percent,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const listUserAttempts = async (userId) => {
  const result = await pool.query(
    `SELECT qa.id,
            qa.started_at,
            qa.completed_at,
            qa.expires_at,
            qa.score,
            qa.percent,
            qa.total_questions,
            s.name AS subject_name,
            et.name AS exam_level_name,
            p.year,
            p.paper_number
       FROM Quiz_Attempt_Table qa
       LEFT JOIN Subject_Table s ON s.id = qa.subject_id
       LEFT JOIN Exam_Type_Table et ON et.id = qa.exam_type_id
       LEFT JOIN Paper_Table p ON p.id = qa.paper_id
      WHERE qa.user_id = $1
      ORDER BY qa.started_at DESC`,
    [userId],
  );

  return result.rows;
};

export const getAttemptReview = async (attemptId, userId) => {
  const attempt = await fetchAttemptSummary(attemptId);
  ensureOwnedAttempt(attempt, userId);

  const answersResult = await pool.query(
    `SELECT aa.question_id,
            aa.selected_option_id,
            aa.is_correct,
            q.question_number,
            q.stem,
            q.explanation,
            q.topic,
            q.difficulty,
            q.paper_id,
            p.year,
            p.paper_number
       FROM Attempt_Answers_Table aa
       JOIN Questions_Table q ON q.id = aa.question_id
       LEFT JOIN Paper_Table p ON p.id = q.paper_id
      WHERE aa.attempt_id = $1
      ORDER BY q.question_number`,
    [attemptId],
  );

  const questionIds = answersResult.rows.map((row) => row.question_id);
  const [optionsRows, topicRows] = await Promise.all([
    selectOptionsForQuestions(questionIds),
    selectTopicsForQuestions(questionIds),
  ]);

  const optionMap = new Map();
  optionsRows.forEach((row) => {
    if (!optionMap.has(row.question_id)) optionMap.set(row.question_id, []);
    optionMap.get(row.question_id).push(row);
  });

  const topicMap = new Map();
  topicRows.forEach((row) => {
    if (!topicMap.has(row.question_id)) topicMap.set(row.question_id, []);
    topicMap.get(row.question_id).push({ id: row.topic_id, name: row.name });
  });

  const questions = answersResult.rows.map((row) => {
    const options = (optionMap.get(row.question_id) || []).map((option) => ({
      id: option.id,
      label: option.label,
      text: option.text,
      is_correct: option.is_correct,
      isSelected: option.id === row.selected_option_id,
    }));
    return {
      id: row.question_id,
      question_number: row.question_number,
      stem: row.stem,
      explanation: row.explanation,
      topic: row.topic,
      difficulty: row.difficulty,
      selected_option_id: row.selected_option_id,
      is_correct: row.is_correct,
      paper: {
        id: row.paper_id,
        year: row.year,
        paper_number: row.paper_number,
      },
      options,
      topics: topicMap.get(row.question_id) || [],
    };
  });

  return {
    attempt,
    questions,
  };
};
