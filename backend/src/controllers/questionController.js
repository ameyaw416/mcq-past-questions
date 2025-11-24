import {
  listQuestionsService,
  getQuestionService,
  createQuestionService,
  updateQuestionService,
  deleteQuestionService,
} from '../services/questionService.js';

const parseUUID = (value) => {
  if (!value || typeof value !== 'string') {
    const err = new Error('Invalid id parameter.');
    err.status = 400;
    throw err;
  }
  return value;
};

const parseIntField = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    const err = new Error(`${fieldName} must be an integer.`);
    err.status = 400;
    throw err;
  }
  return parsed;
};

const validateQuestionPayload = (body) => {
  const { paperId, questionNumber, stem, options } = body;
  if (!paperId || !questionNumber || !stem) {
    const err = new Error('paperId, questionNumber, and stem are required.');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(options) || !options.length) {
    const err = new Error('options array with at least one entry is required.');
    err.status = 400;
    throw err;
  }
};

export const getQuestions = async (req, res, next) => {
  try {
    const questions = await listQuestionsService();
    res.json({ questions });
  } catch (err) {
    next(err);
  }
};

export const getQuestion = async (req, res, next) => {
  try {
    const id = parseUUID(req.params.id);
    const question = await getQuestionService(id);
    res.json({ question });
  } catch (err) {
    next(err);
  }
};

export const createQuestion = async (req, res, next) => {
  try {
    validateQuestionPayload(req.body);
    const question = await createQuestionService({
      paperId: parseIntField(req.body.paperId, 'paperId'),
      questionNumber: parseIntField(req.body.questionNumber, 'questionNumber'),
      stem: req.body.stem,
      explanation: req.body.explanation || null,
      topic: req.body.topic || null,
      difficulty: req.body.difficulty || null,
      options: req.body.options,
      topicIds: req.body.topicIds,
    });
    res.status(201).json({ question });
  } catch (err) {
    next(err);
  }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const id = parseUUID(req.params.id);
    validateQuestionPayload(req.body);
    const question = await updateQuestionService(id, {
      paperId: parseIntField(req.body.paperId, 'paperId'),
      questionNumber: parseIntField(req.body.questionNumber, 'questionNumber'),
      stem: req.body.stem,
      explanation: req.body.explanation || null,
      topic: req.body.topic || null,
      difficulty: req.body.difficulty || null,
      options: req.body.options,
      topicIds: req.body.topicIds,
    });
    res.json({ question });
  } catch (err) {
    next(err);
  }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    const id = parseUUID(req.params.id);
    await deleteQuestionService(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
