import {
  submitAttemptService,
  listUserAttempts,
  getAttemptReview,
} from '../services/attemptService.js';

export const submitAttempt = async (req, res, next) => {
  try {
    const result = await submitAttemptService({
      attemptId: req.params.id,
      userId: req.user.id,
      answers: req.body.answers || [],
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getMyAttempts = async (req, res, next) => {
  try {
    const attempts = await listUserAttempts(req.user.id);
    res.json({ attempts });
  } catch (err) {
    next(err);
  }
};

export const getAttemptDetails = async (req, res, next) => {
  try {
    const review = await getAttemptReview(req.params.id, req.user.id);
    res.json(review);
  } catch (err) {
    next(err);
  }
};
