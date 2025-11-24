import pool from '../config/db.js';
import {
  selectQuestions,
  selectQuestionById,
  insertQuestionRecord,
  updateQuestionRecord,
  deleteQuestionRecord,
  selectOptionsForQuestions,
  selectTopicsForQuestions,
  deleteOptionsByQuestion,
  deleteQuestionTopics,
  insertQuestionOption,
  insertQuestionTopic,
} from '../models/questionModel.js';

const notFound = (resource) => {
  const error = new Error(`${resource} not found.`);
  error.status = 404;
  return error;
};

const ensureOptionsValid = (options) => {
  if (!Array.isArray(options) || options.length === 0) {
    const err = new Error('At least one answer option is required.');
    err.status = 400;
    throw err;
  }
  const hasCorrect = options.some((opt) => Boolean(opt.isCorrect));
  if (!hasCorrect) {
    const err = new Error('At least one answer option must be marked correct.');
    err.status = 400;
    throw err;
  }
};

const normalizeTopicIds = (topicIds = []) => {
  if (!Array.isArray(topicIds)) return [];
  return topicIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
};

const attachRelations = (questions, optionRows, topicRows) => {
  const optionMap = new Map();
  optionRows.forEach((row) => {
    if (!optionMap.has(row.question_id)) optionMap.set(row.question_id, []);
    optionMap.get(row.question_id).push({
      id: row.id,
      label: row.label,
      text: row.text,
      is_correct: row.is_correct,
    });
  });

  const topicMap = new Map();
  topicRows.forEach((row) => {
    if (!topicMap.has(row.question_id)) topicMap.set(row.question_id, []);
    topicMap.get(row.question_id).push({
      id: row.topic_id,
      name: row.name,
    });
  });

  return questions.map((question) => ({
    ...question,
    options: optionMap.get(question.id) || [],
    topics: topicMap.get(question.id) || [],
  }));
};

export const listQuestionsService = async () => {
  const questions = await selectQuestions();
  if (!questions.length) return [];
  const ids = questions.map((q) => q.id);
  const [options, topics] = await Promise.all([
    selectOptionsForQuestions(ids),
    selectTopicsForQuestions(ids),
  ]);
  return attachRelations(questions, options, topics);
};

export const getQuestionService = async (id) => {
  const question = await selectQuestionById(id);
  if (!question) throw notFound('Question');
  const [options, topics] = await Promise.all([
    selectOptionsForQuestions([question.id]),
    selectTopicsForQuestions([question.id]),
  ]);
  return attachRelations([question], options, topics)[0];
};

export const createQuestionService = async ({
  paperId,
  questionNumber,
  stem,
  explanation,
  topic,
  difficulty,
  options,
  topicIds,
}) => {
  ensureOptionsValid(options);
  const normalizedTopicIds = normalizeTopicIds(topicIds);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const question = await insertQuestionRecord(
      { paperId, questionNumber, stem, explanation, topic, difficulty },
      client,
    );

    for (const option of options) {
      await insertQuestionOption(
        {
          questionId: question.id,
          label: option.label,
          text: option.text,
          isCorrect: Boolean(option.isCorrect),
        },
        client,
      );
    }

    for (const topicId of normalizedTopicIds) {
      await insertQuestionTopic({ questionId: question.id, topicId }, client);
    }

    await client.query('COMMIT');
    return getQuestionService(question.id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const updateQuestionService = async (
  id,
  { paperId, questionNumber, stem, explanation, topic, difficulty, options, topicIds },
) => {
  ensureOptionsValid(options);
  const normalizedTopicIds = normalizeTopicIds(topicIds);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updatedQuestion = await updateQuestionRecord(
      id,
      { paperId, questionNumber, stem, explanation, topic, difficulty },
      client,
    );
    if (!updatedQuestion) throw notFound('Question');

    await deleteOptionsByQuestion(id, client);
    for (const option of options) {
      await insertQuestionOption(
        {
          questionId: id,
          label: option.label,
          text: option.text,
          isCorrect: Boolean(option.isCorrect),
        },
        client,
      );
    }

    await deleteQuestionTopics(id, client);

    for (const topicId of normalizedTopicIds) {
      await insertQuestionTopic({ questionId: id, topicId }, client);
    }

    await client.query('COMMIT');
    return getQuestionService(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const deleteQuestionService = async (id) => {
  const deleted = await deleteQuestionRecord(id);
  if (!deleted) throw notFound('Question');
  return deleted;
};
