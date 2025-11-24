import {
  listExamLevels,
  findExamLevel,
  createExamLevel,
  updateExamLevel,
  removeExamLevel,
  listSubjects,
  findSubject,
  createSubject,
  updateSubject,
  removeSubject,
  listTopics,
  findTopic,
  createTopic,
  updateTopic,
  removeTopic,
  listPapers,
  findPaper,
  createPaper,
  updatePaper,
  removePaper,
} from '../services/catalogService.js';

// Helpers
const parseIntParam = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    const error = new Error('Invalid id parameter.');
    error.status = 400;
    throw error;
  }
  return parsed;
};

// Exam levels
export const getExamLevelsController = async (req, res, next) => {
  try {
    const items = await listExamLevels();
    res.json({ examLevels: items });
  } catch (err) {
    next(err);
  }
};

export const getExamLevelController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    const examLevel = await findExamLevel(id);
    res.json({ examLevel });
  } catch (err) {
    next(err);
  }
};

export const createExamLevelController = async (req, res, next) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: 'code and name are required.' });
    }
    const examLevel = await createExamLevel({ code, name });
    res.status(201).json({ examLevel });
  } catch (err) {
    next(err);
  }
};

export const updateExamLevelController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ message: 'code and name are required.' });
    }
    const examLevel = await updateExamLevel(id, { code, name });
    res.json({ examLevel });
  } catch (err) {
    next(err);
  }
};

export const deleteExamLevelController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    await removeExamLevel(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Subjects
export const getSubjectsController = async (req, res, next) => {
  try {
    const subjects = await listSubjects();
    res.json({ subjects });
  } catch (err) {
    next(err);
  }
};

export const getSubjectController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    const subject = await findSubject(id);
    res.json({ subject });
  } catch (err) {
    next(err);
  }
};

export const createSubjectController = async (req, res, next) => {
  try {
    const { examTypeId, name, code } = req.body;
    if (!examTypeId || !name || !code) {
      return res.status(400).json({ message: 'examTypeId, name and code are required.' });
    }
    const subject = await createSubject({
      examTypeId: Number(examTypeId),
      name,
      code,
    });
    res.status(201).json({ subject });
  } catch (err) {
    next(err);
  }
};

export const updateSubjectController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    const { examTypeId, name, code } = req.body;
    if (!examTypeId || !name || !code) {
      return res.status(400).json({ message: 'examTypeId, name and code are required.' });
    }
    const subject = await updateSubject(id, {
      examTypeId: Number(examTypeId),
      name,
      code,
    });
    res.json({ subject });
  } catch (err) {
    next(err);
  }
};

export const deleteSubjectController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    await removeSubject(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Topics
export const getTopicsController = async (req, res, next) => {
  try {
    const topics = await listTopics();
    res.json({ topics });
  } catch (err) {
    next(err);
  }
};

export const getTopicController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    const topic = await findTopic(id);
    res.json({ topic });
  } catch (err) {
    next(err);
  }
};

export const createTopicController = async (req, res, next) => {
  try {
    const { subjectId, name, code, description } = req.body;
    if (!subjectId || !name) {
      return res.status(400).json({ message: 'subjectId and name are required.' });
    }
    const topic = await createTopic({
      subjectId: Number(subjectId),
      name,
      code: code || null,
      description: description || null,
    });
    res.status(201).json({ topic });
  } catch (err) {
    next(err);
  }
};

export const updateTopicController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    const { subjectId, name, code, description } = req.body;
    if (!subjectId || !name) {
      return res.status(400).json({ message: 'subjectId and name are required.' });
    }
    const topic = await updateTopic(id, {
      subjectId: Number(subjectId),
      name,
      code: code || null,
      description: description || null,
    });
    res.json({ topic });
  } catch (err) {
    next(err);
  }
};

export const deleteTopicController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    await removeTopic(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Papers
export const getPapersController = async (req, res, next) => {
  try {
    const papers = await listPapers();
    res.json({ papers });
  } catch (err) {
    next(err);
  }
};

export const getPaperController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    const paper = await findPaper(id);
    res.json({ paper });
  } catch (err) {
    next(err);
  }
};

export const createPaperController = async (req, res, next) => {
  try {
    const { subjectId, year, paperNumber, description } = req.body;
    if (!subjectId || !year || !paperNumber) {
      return res
        .status(400)
        .json({ message: 'subjectId, year and paperNumber are required.' });
    }
    const paper = await createPaper({
      subjectId: Number(subjectId),
      year: Number(year),
      paperNumber: Number(paperNumber),
      description: description || null,
    });
    res.status(201).json({ paper });
  } catch (err) {
    next(err);
  }
};

export const updatePaperController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    const { subjectId, year, paperNumber, description } = req.body;
    if (!subjectId || !year || !paperNumber) {
      return res
        .status(400)
        .json({ message: 'subjectId, year and paperNumber are required.' });
    }
    const paper = await updatePaper(id, {
      subjectId: Number(subjectId),
      year: Number(year),
      paperNumber: Number(paperNumber),
      description: description || null,
    });
    res.json({ paper });
  } catch (err) {
    next(err);
  }
};

export const deletePaperController = async (req, res, next) => {
  try {
    const id = parseIntParam(req.params.id);
    await removePaper(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
