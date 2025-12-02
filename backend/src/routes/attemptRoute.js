import express from 'express';
import verifyAuth from '../middlewares/authMiddleware.js';
import { createAttempt } from '../controllers/quizController.js';
import {
  submitAttempt,
  getMyAttempts,
  getAttemptDetails,
} from '../controllers/attemptController.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/', createAttempt);
router.post('/:id/submit', submitAttempt);
router.get('/my', getMyAttempts);
router.get('/:id', getAttemptDetails);

export default router;
