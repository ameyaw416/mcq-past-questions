import express from 'express';
import adminAuth from '../middlewares/adminAuth.js';
import {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/questionController.js';

const router = express.Router();

router.get('/', getQuestions);
router.get('/:id', getQuestion);
router.post('/', adminAuth, createQuestion);
router.put('/:id', adminAuth, updateQuestion);
router.delete('/:id', adminAuth, deleteQuestion);

export default router;
