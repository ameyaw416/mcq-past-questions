import { MAX_FILE_SIZE_BYTES, importQuestions, previewImport } from '../services/importService.js';

const ensureFilePresent = (req) => {
  if (!req.file) {
    const error = new Error('CSV file is required.');
    error.status = 400;
    throw error;
  }
  if (req.file.size > MAX_FILE_SIZE_BYTES) {
    const error = new Error('Uploaded file exceeds the allowed size.');
    error.status = 400;
    throw error;
  }
};

export const handleImport = async (req, res, next) => {
  try {
    ensureFilePresent(req);
    const result = await importQuestions({
      buffer: req.file.buffer,
      filename: req.file.originalname,
      userId: req.user?.id,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const previewImportController = async (req, res, next) => {
  try {
    ensureFilePresent(req);
    const result = await previewImport({
      buffer: req.file.buffer,
      filename: req.file.originalname,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
