import {
  getExamLevels,
  getExamLevelById,
  insertExamLevel,
  updateExamLevelRecord,
  deleteExamLevelRecord,
  getSubjects,
  getSubjectById,
  insertSubject,
  updateSubjectRecord,
  deleteSubjectRecord,
  getTopics,
  getTopicById,
  insertTopic,
  updateTopicRecord,
  deleteTopicRecord,
  getPapers,
  getPaperById,
  insertPaper,
  updatePaperRecord,
  deletePaperRecord,
} from '../models/catalogModel.js';

const notFoundError = (resource) => {
  const error = new Error(`${resource} not found.`);
  error.status = 404;
  return error;
};

// Exam levels
export const listExamLevels = () => getExamLevels();

export const findExamLevel = async (id) => {
  const examLevel = await getExamLevelById(id);
  if (!examLevel) throw notFoundError('Exam level');
  return examLevel;
};

export const createExamLevel = ({ code, name }) => insertExamLevel({ code, name });

export const updateExamLevel = async (id, payload) => {
  const updated = await updateExamLevelRecord(id, payload);
  if (!updated) throw notFoundError('Exam level');
  return updated;
};

export const removeExamLevel = async (id) => {
  const deleted = await deleteExamLevelRecord(id);
  if (!deleted) throw notFoundError('Exam level');
  return deleted;
};

// Subjects
export const listSubjects = () => getSubjects();

export const findSubject = async (id) => {
  const subject = await getSubjectById(id);
  if (!subject) throw notFoundError('Subject');
  return subject;
};

export const createSubject = ({ examTypeId, name, code }) =>
  insertSubject({ examTypeId, name, code });

export const updateSubject = async (id, payload) => {
  const updated = await updateSubjectRecord(id, payload);
  if (!updated) throw notFoundError('Subject');
  return updated;
};

export const removeSubject = async (id) => {
  const deleted = await deleteSubjectRecord(id);
  if (!deleted) throw notFoundError('Subject');
  return deleted;
};

// Topics
export const listTopics = () => getTopics();

export const findTopic = async (id) => {
  const topic = await getTopicById(id);
  if (!topic) throw notFoundError('Topic');
  return topic;
};

export const createTopic = ({ subjectId, name, code, description }) =>
  insertTopic({ subjectId, name, code, description });

export const updateTopic = async (id, payload) => {
  const updated = await updateTopicRecord(id, payload);
  if (!updated) throw notFoundError('Topic');
  return updated;
};

export const removeTopic = async (id) => {
  const deleted = await deleteTopicRecord(id);
  if (!deleted) throw notFoundError('Topic');
  return deleted;
};

// Papers
export const listPapers = () => getPapers();

export const findPaper = async (id) => {
  const paper = await getPaperById(id);
  if (!paper) throw notFoundError('Paper');
  return paper;
};

export const createPaper = ({ subjectId, year, paperNumber, description }) =>
  insertPaper({ subjectId, year, paperNumber, description });

export const updatePaper = async (id, payload) => {
  const updated = await updatePaperRecord(id, payload);
  if (!updated) throw notFoundError('Paper');
  return updated;
};

export const removePaper = async (id) => {
  const deleted = await deletePaperRecord(id);
  if (!deleted) throw notFoundError('Paper');
  return deleted;
};
