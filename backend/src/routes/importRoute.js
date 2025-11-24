import express from 'express';
import multer from 'multer';
import adminAuth from '../middlewares/adminAuth.js';
import { handleImport, previewImportController } from '../controllers/importController.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/imports', adminAuth, upload.single('file'), handleImport);
router.post('/imports/preview', adminAuth, upload.single('file'), previewImportController);

export default router;
