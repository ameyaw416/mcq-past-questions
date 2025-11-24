import pool from '../config/db.js';

// Exam Levels (Exam_Type_Table)
export const getExamLevels = () =>
  pool
    .query('SELECT id, code, name, created_at FROM Exam_Type_Table ORDER BY name ASC')
    .then((result) => result.rows);

export const getExamLevelById = (id) =>
  pool
    .query('SELECT id, code, name, created_at FROM Exam_Type_Table WHERE id = $1', [id])
    .then((result) => result.rows[0] || null);

export const insertExamLevel = ({ code, name }) =>
  pool
    .query(
      `INSERT INTO Exam_Type_Table (code, name)
       VALUES ($1, $2)
       RETURNING id, code, name, created_at`,
      [code, name],
    )
    .then((result) => result.rows[0]);

export const updateExamLevelRecord = (id, { code, name }) =>
  pool
    .query(
      `UPDATE Exam_Type_Table
       SET code = $2, name = $3
       WHERE id = $1
       RETURNING id, code, name, created_at`,
      [id, code, name],
    )
    .then((result) => result.rows[0] || null);

export const deleteExamLevelRecord = (id) =>
  pool
    .query('DELETE FROM Exam_Type_Table WHERE id = $1 RETURNING id', [id])
    .then((result) => result.rows[0] || null);

// Subjects (Subject_Table)
export const getSubjects = () =>
  pool
    .query(
      `SELECT id, exam_type_id, name, code, created_at
       FROM Subject_Table
       ORDER BY name ASC`,
    )
    .then((result) => result.rows);

export const getSubjectById = (id) =>
  pool
    .query(
      `SELECT id, exam_type_id, name, code, created_at
       FROM Subject_Table
       WHERE id = $1`,
      [id],
    )
    .then((result) => result.rows[0] || null);

export const insertSubject = ({ examTypeId, name, code }) =>
  pool
    .query(
      `INSERT INTO Subject_Table (exam_type_id, name, code)
       VALUES ($1, $2, $3)
       RETURNING id, exam_type_id, name, code, created_at`,
      [examTypeId, name, code],
    )
    .then((result) => result.rows[0]);

export const updateSubjectRecord = (id, { examTypeId, name, code }) =>
  pool
    .query(
      `UPDATE Subject_Table
       SET exam_type_id = $2,
           name = $3,
           code = $4
       WHERE id = $1
       RETURNING id, exam_type_id, name, code, created_at`,
      [id, examTypeId, name, code],
    )
    .then((result) => result.rows[0] || null);

export const deleteSubjectRecord = (id) =>
  pool
    .query('DELETE FROM Subject_Table WHERE id = $1 RETURNING id', [id])
    .then((result) => result.rows[0] || null);

// Topics (Topics_Table)
export const getTopics = () =>
  pool
    .query(
      `SELECT id, subject_id, name, code, description, created_at
       FROM Topics_Table
       ORDER BY name ASC`,
    )
    .then((result) => result.rows);

export const getTopicById = (id) =>
  pool
    .query(
      `SELECT id, subject_id, name, code, description, created_at
       FROM Topics_Table
       WHERE id = $1`,
      [id],
    )
    .then((result) => result.rows[0] || null);

export const insertTopic = ({ subjectId, name, code, description }) =>
  pool
    .query(
      `INSERT INTO Topics_Table (subject_id, name, code, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, subject_id, name, code, description, created_at`,
      [subjectId, name, code || null, description || null],
    )
    .then((result) => result.rows[0]);

export const updateTopicRecord = (id, { subjectId, name, code, description }) =>
  pool
    .query(
      `UPDATE Topics_Table
       SET subject_id = $2,
           name = $3,
           code = $4,
           description = $5
       WHERE id = $1
       RETURNING id, subject_id, name, code, description, created_at`,
      [id, subjectId, name, code || null, description || null],
    )
    .then((result) => result.rows[0] || null);

export const deleteTopicRecord = (id) =>
  pool
    .query('DELETE FROM Topics_Table WHERE id = $1 RETURNING id', [id])
    .then((result) => result.rows[0] || null);

// Papers (Paper_Table)
export const getPapers = () =>
  pool
    .query(
      `SELECT id, subject_id, year, paper_number, description, created_at
       FROM Paper_Table
       ORDER BY year DESC, paper_number ASC`,
    )
    .then((result) => result.rows);

export const getPaperById = (id) =>
  pool
    .query(
      `SELECT id, subject_id, year, paper_number, description, created_at
       FROM Paper_Table
       WHERE id = $1`,
      [id],
    )
    .then((result) => result.rows[0] || null);

export const insertPaper = ({ subjectId, year, paperNumber, description }) =>
  pool
    .query(
      `INSERT INTO Paper_Table (subject_id, year, paper_number, description)
       VALUES ($1, $2, $3, $4)
       RETURNING id, subject_id, year, paper_number, description, created_at`,
      [subjectId, year, paperNumber, description || null],
    )
    .then((result) => result.rows[0]);

export const updatePaperRecord = (id, { subjectId, year, paperNumber, description }) =>
  pool
    .query(
      `UPDATE Paper_Table
       SET subject_id = $2,
           year = $3,
           paper_number = $4,
           description = $5
       WHERE id = $1
       RETURNING id, subject_id, year, paper_number, description, created_at`,
      [id, subjectId, year, paperNumber, description || null],
    )
    .then((result) => result.rows[0] || null);

export const deletePaperRecord = (id) =>
  pool
    .query('DELETE FROM Paper_Table WHERE id = $1 RETURNING id', [id])
    .then((result) => result.rows[0] || null);
