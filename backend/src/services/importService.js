import { parse } from 'csv-parse/sync';
import pool from '../config/db.js';
import { createQuestionService } from './questionService.js';

const FILE_MAX_SIZE_MB = Number(process.env.IMPORT_FILE_MAX_MB || 5);
export const MAX_FILE_SIZE_BYTES = FILE_MAX_SIZE_MB * 1024 * 1024;

const REQUIRED_COLUMNS = [
  'exam_level_code',
  'subject_code',
  'paper_year',
  'paper_number',
  'question_number',
  'stem',
  'correct_option',
];

const OPTION_PREFIX = /^option_([a-z])$/i;

const toInt = (value, field) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    const err = new Error(`${field} must be an integer.`);
    err.status = 400;
    throw err;
  }
  return parsed;
};

const getExamLevelId = async (cache, code) => {
  if (!code) {
    throw new Error('exam_level_code is required.');
  }
  const normalized = code.trim().toUpperCase();
  if (cache.examLevels.has(normalized)) return cache.examLevels.get(normalized);
  const result = await pool.query('SELECT id FROM Exam_Type_Table WHERE UPPER(code) = $1', [
    normalized,
  ]);
  const row = result.rows[0];
  if (!row) {
    throw new Error(`Exam level code '${normalized}' not found.`);
  }
  cache.examLevels.set(normalized, row.id);
  return row.id;
};

const getSubjectId = async (cache, examLevelId, subjectCode) => {
  if (!subjectCode) {
    throw new Error('subject_code is required.');
  }
  const normalized = subjectCode.trim().toUpperCase();
  const cacheKey = `${examLevelId}:${normalized}`;
  if (cache.subjects.has(cacheKey)) return cache.subjects.get(cacheKey);
  const result = await pool.query(
    `SELECT id FROM Subject_Table WHERE exam_type_id = $1 AND UPPER(code) = $2`,
    [examLevelId, normalized],
  );
  const row = result.rows[0];
  if (!row) {
    throw new Error(`Subject code '${normalized}' not found for exam level.`);
  }
  cache.subjects.set(cacheKey, row.id);
  return row.id;
};

const getTopicsForSubject = async (cache, subjectId) => {
  if (cache.topics.has(subjectId)) return cache.topics.get(subjectId);
  const result = await pool.query(
    `SELECT id, COALESCE(code, '') AS code, LOWER(name) AS name
       FROM Topics_Table
      WHERE subject_id = $1`,
    [subjectId],
  );
  const topicMap = new Map();
  result.rows.forEach((row) => {
    if (row.code) topicMap.set(row.code.toUpperCase(), row.id);
    topicMap.set(row.name.toLowerCase(), row.id);
  });
  cache.topics.set(subjectId, topicMap);
  return topicMap;
};

const getPaperId = async (subjectId, year, paperNumber, { createIfMissing }) => {
  const existing = await pool.query(
    `SELECT id FROM Paper_Table WHERE subject_id = $1 AND year = $2 AND paper_number = $3`,
    [subjectId, year, paperNumber],
  );
  if (existing.rowCount) return existing.rows[0].id;
  if (!createIfMissing) {
    throw new Error(
      `Paper for year ${year} number ${paperNumber} does not exist for this subject.`,
    );
  }
  const insert = await pool.query(
    `INSERT INTO Paper_Table (subject_id, year, paper_number)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [subjectId, year, paperNumber],
  );
  return insert.rows[0].id;
};

const ensureQuestionNotExists = async (paperId, questionNumber) => {
  const existing = await pool.query(
    `SELECT id FROM Questions_Table WHERE paper_id = $1 AND question_number = $2`,
    [paperId, questionNumber],
  );
  if (existing.rowCount) {
    throw new Error('Question already exists for this paper and question_number.');
  }
};

const parseOptions = (row) => {
  const options = [];
  Object.entries(row).forEach(([key, value]) => {
    const match = OPTION_PREFIX.exec(key);
    if (match && value) {
      const label = match[1].toUpperCase();
      options.push({ label, text: value.trim(), isCorrect: false });
    }
  });
  if (!options.length) {
    throw new Error('At least one option (option_a, option_b, ...) is required.');
  }

  const correctLabel = (row.correct_option || '').trim().toUpperCase();
  if (!correctLabel) {
    throw new Error('correct_option column is required.');
  }

  let correctCount = 0;
  options.forEach((option) => {
    if (option.label === correctLabel) {
      option.isCorrect = true;
      correctCount += 1;
    }
  });

  if (correctCount !== 1) {
    throw new Error('correct_option must match exactly one provided option label.');
  }

  return options;
};

const resolveTopicIds = async (cache, subjectId, topicRefsRaw = '') => {
  if (!topicRefsRaw) return [];
  const referenceParts = topicRefsRaw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (!referenceParts.length) return [];

  const topicMap = await getTopicsForSubject(cache, subjectId);
  const resolved = [];
  const seen = new Set();
  referenceParts.forEach((ref) => {
    const normalizedCode = ref.toUpperCase();
    const normalizedName = ref.toLowerCase();
    const topicId = topicMap.get(normalizedCode) || topicMap.get(normalizedName);
    if (topicId && !seen.has(topicId)) {
      seen.add(topicId);
      resolved.push(topicId);
    }
  });

  if (!resolved.length) {
    throw new Error(`Topics '${referenceParts.join(', ')}' not found for subject.`);
  }

  return resolved;
};

const parseCsv = (buffer) => {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
};

const validateColumns = (row) => {
  for (const column of REQUIRED_COLUMNS) {
    if (!row[column] || row[column].toString().trim() === '') {
      throw new Error(`${column} is required.`);
    }
  }
};

const insertImportRecord = async (userId, filename, totalRows) => {
  const result = await pool.query(
    `INSERT INTO Imports_Table (user_id, source, original_filename, status, total_rows, processed_rows, successful_rows)
     VALUES ($1, $2, $3, 'processing', $4, 0, 0)
     RETURNING id`,
    [userId || null, 'csv', filename, totalRows],
  );
  return result.rows[0].id;
};

const finalizeImportRecord = async (importId, processedRows, successCount, errorCount) => {
  const status = errorCount ? 'completed_with_errors' : 'completed';
  await pool.query(
    `UPDATE Imports_Table
        SET processed_rows = $2,
            successful_rows = $3,
            status = $4,
            completed_at = NOW()
      WHERE id = $1`,
    [importId, processedRows, successCount, status],
  );
};

const logImportError = async (importId, rowNumber, message) => {
  if (!importId) return;
  await pool.query(
    `INSERT INTO Import_Errors_Table (import_id, row_number, message)
     VALUES ($1, $2, $3)`,
    [importId, rowNumber, message],
  );
};

const processRows = async ({ rows, filename, userId, preview }) => {
  const cache = {
    examLevels: new Map(),
    subjects: new Map(),
    topics: new Map(),
  };

  const errors = [];
  let successCount = 0;
  const totalRows = rows.length;
  const importId = preview ? null : await insertImportRecord(userId, filename, totalRows);

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2; // assuming header row is 1
    const row = rows[index];
    try {
      validateColumns(row);
      const examLevelId = await getExamLevelId(cache, row.exam_level_code);
      const subjectId = await getSubjectId(cache, examLevelId, row.subject_code);
      const year = toInt(row.paper_year, 'paper_year');
      const paperNumber = toInt(row.paper_number, 'paper_number');
      const questionNumber = toInt(row.question_number, 'question_number');
      const paperId = await getPaperId(subjectId, year, paperNumber, {
        createIfMissing: !preview,
      });
      const options = parseOptions(row);
      const topicIds = await resolveTopicIds(cache, subjectId, row.topic_codes);

      if (!preview) {
        await createQuestionService({
          paperId,
          questionNumber,
          stem: row.stem,
          explanation: row.explanation || null,
          topic: row.topic || null,
          difficulty: row.difficulty || null,
          options,
          topicIds,
        });
      } else {
        await ensureQuestionNotExists(paperId, questionNumber);
      }

      successCount += 1;
    } catch (err) {
      const message = err.message || 'Unknown error';
      errors.push({ rowNumber, message });
      await logImportError(importId, rowNumber, message);
    }
  }

  if (!preview && importId) {
    await finalizeImportRecord(importId, totalRows, successCount, errors.length);
  }

  return {
    filename,
    totalRows,
    successCount,
    errorCount: errors.length,
    errors,
    importId,
  };
};

export const importQuestions = async ({ buffer, filename, userId }) => {
  const rows = parseCsv(buffer);
  if (!rows.length) {
    throw new Error('No rows found in the uploaded file.');
  }
  return processRows({ rows, filename, userId, preview: false });
};

export const previewImport = async ({ buffer, filename }) => {
  const rows = parseCsv(buffer);
  if (!rows.length) {
    throw new Error('No rows found in the uploaded file.');
  }
  return processRows({ rows, filename, userId: null, preview: true });
};
