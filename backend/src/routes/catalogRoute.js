import express from 'express';
import adminAuth from '../middlewares/adminAuth.js';
import {
  getExamLevelsController,
  getExamLevelController,
  createExamLevelController,
  updateExamLevelController,
  deleteExamLevelController,
  getSubjectsController,
  getSubjectController,
  createSubjectController,
  updateSubjectController,
  deleteSubjectController,
  getTopicsController,
  getTopicController,
  createTopicController,
  updateTopicController,
  deleteTopicController,
  getPapersController,
  getPaperController,
  createPaperController,
  updatePaperController,
  deletePaperController,
} from '../controllers/catalogController.js';

const router = express.Router();

// Exam levels
router.get('/exam-levels', getExamLevelsController);
router.get('/exam-levels/:id', getExamLevelController);
router.post('/exam-levels', adminAuth, createExamLevelController);
router.put('/exam-levels/:id', adminAuth, updateExamLevelController);
router.delete('/exam-levels/:id', adminAuth, deleteExamLevelController);

// Subjects
router.get('/subjects', getSubjectsController);
router.get('/subjects/:id', getSubjectController);
router.post('/subjects', adminAuth, createSubjectController);
router.put('/subjects/:id', adminAuth, updateSubjectController);
router.delete('/subjects/:id', adminAuth, deleteSubjectController);

// Topics
router.get('/topics', getTopicsController);
router.get('/topics/:id', getTopicController);
router.post('/topics', adminAuth, createTopicController);
router.put('/topics/:id', adminAuth, updateTopicController);
router.delete('/topics/:id', adminAuth, deleteTopicController);

// Papers
router.get('/papers', getPapersController);
router.get('/papers/:id', getPaperController);
router.post('/papers', adminAuth, createPaperController);
router.put('/papers/:id', adminAuth, updatePaperController);
router.delete('/papers/:id', adminAuth, deletePaperController);

export default router;
