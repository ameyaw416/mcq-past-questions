import { startQuizAttempt } from '../services/quizService.js';

const parseOptionalInt = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    const error = new Error('Numeric fields must be valid numbers.');
    error.status = 400;
    throw error;
  }
  return parsed;
};

export const createAttempt = async (req, res, next) => {
  try {
    const payload = await startQuizAttempt({
      userId: req.user.id,
      subjectId: req.body.subjectId ? Number(req.body.subjectId) : undefined,
      paperId: req.body.paperId ? Number(req.body.paperId) : undefined,
      numQuestions: parseOptionalInt(req.body.numQuestions),
      durationMinutes: parseOptionalInt(req.body.durationMinutes),
    });
    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
};
