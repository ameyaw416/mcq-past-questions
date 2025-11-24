import pool from '../config/db.js';
import { runMigrations } from '../migrations/runMigrations.js';

const seedData = [
  {
    examLevel: { code: 'BECE', name: 'Basic Education Certificate Examination' },
    subjects: [
      {
        code: 'MATH',
        name: 'Mathematics',
        topics: [
          { code: 'ALG', name: 'Algebra', description: 'Linear equations and expressions.' },
          { code: 'GEO', name: 'Geometry', description: 'Shapes, areas and measurements.' },
        ],
        papers: [
          {
            year: 2023,
            paperNumber: 1,
            description: 'BECE Mathematics Paper 1 (2023)',
            questions: [
              {
                number: 1,
                stem: 'Solve 3x = 15. What is the value of x?',
                explanation: 'Divide both sides by 3 to isolate x.',
                difficulty: 'easy',
                topicRefs: ['ALG'],
                options: [
                  { label: 'A', text: '3', isCorrect: false },
                  { label: 'B', text: '4', isCorrect: false },
                  { label: 'C', text: '5', isCorrect: true },
                  { label: 'D', text: '6', isCorrect: false },
                ],
              },
            ],
          },
          {
            year: 2024,
            paperNumber: 1,
            description: 'BECE Mathematics Paper 1 (2024)',
            questions: [
              {
                number: 1,
                stem: 'A square has side length 6 cm. What is its area?',
                explanation: 'Area of a square is side squared.',
                difficulty: 'easy',
                topicRefs: ['GEO'],
                options: [
                  { label: 'A', text: '12 cm²', isCorrect: false },
                  { label: 'B', text: '18 cm²', isCorrect: false },
                  { label: 'C', text: '24 cm²', isCorrect: false },
                  { label: 'D', text: '36 cm²', isCorrect: true },
                ],
              },
            ],
          },
        ],
      },
      {
        code: 'ENG',
        name: 'English Language',
        topics: [
          { code: 'GRAM', name: 'Grammar', description: 'Sentence construction and tenses.' },
          { code: 'VOC', name: 'Vocabulary', description: 'Word meanings and usage.' },
        ],
        papers: [
          {
            year: 2023,
            paperNumber: 1,
            description: 'BECE English Language Paper 1 (2023)',
            questions: [
              {
                number: 1,
                stem: 'Choose the word that best completes the sentence: "The meeting was ___ because of the heavy rain."',
                explanation: 'A formal meeting is postponed or adjourned.',
                difficulty: 'medium',
                topicRefs: ['VOC'],
                options: [
                  { label: 'A', text: 'hurried', isCorrect: false },
                  { label: 'B', text: 'adjourned', isCorrect: true },
                  { label: 'C', text: 'ignored', isCorrect: false },
                  { label: 'D', text: 'welcomed', isCorrect: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    examLevel: {
      code: 'WASSCE',
      name: 'West African Senior School Certificate Examination',
    },
    subjects: [
      {
        code: 'SCI',
        name: 'Integrated Science',
        topics: [
          { code: 'BIO', name: 'Biology Concepts', description: 'Plants and life processes.' },
          { code: 'CHEM', name: 'Chemistry Basics', description: 'Elements and compounds.' },
        ],
        papers: [
          {
            year: 2022,
            paperNumber: 1,
            description: 'WASSCE Integrated Science Paper 1 (2022)',
            questions: [
              {
                number: 1,
                stem: 'Which process in plants is responsible for the release of oxygen?',
                explanation: 'Photosynthesis releases oxygen as a by-product.',
                difficulty: 'medium',
                topicRefs: ['BIO'],
                options: [
                  { label: 'A', text: 'Respiration', isCorrect: false },
                  { label: 'B', text: 'Transpiration', isCorrect: false },
                  { label: 'C', text: 'Photosynthesis', isCorrect: true },
                  { label: 'D', text: 'Germination', isCorrect: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

const upsertExamLevel = async (client, { code, name }) => {
  const result = await client.query(
    `INSERT INTO Exam_Type_Table (code, name)
     VALUES ($1, $2)
     ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [code, name],
  );
  return result.rows[0].id;
};

const upsertSubject = async (client, examTypeId, { code, name }) => {
  const result = await client.query(
    `INSERT INTO Subject_Table (exam_type_id, code, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (exam_type_id, code) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [examTypeId, code, name],
  );
  return result.rows[0].id;
};

const upsertTopics = async (client, subjectId, topics = []) => {
  const lookup = new Map();
  for (const topic of topics) {
    const result = await client.query(
      `INSERT INTO Topics_Table (subject_id, name, code, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (subject_id, name) DO UPDATE
       SET code = EXCLUDED.code,
           description = EXCLUDED.description
       RETURNING id, name`,
      [subjectId, topic.name, topic.code || null, topic.description || null],
    );
    const data = { id: result.rows[0].id, name: result.rows[0].name };
    if (topic.code) {
      lookup.set(topic.code.toUpperCase(), data);
    }
    lookup.set(topic.name.toLowerCase(), data);
  }
  return lookup;
};

const upsertPaper = async (client, subjectId, { year, paperNumber, description }) => {
  const result = await client.query(
    `INSERT INTO Paper_Table (subject_id, year, paper_number, description)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (subject_id, year, paper_number) DO UPDATE
     SET description = EXCLUDED.description
     RETURNING id`,
    [subjectId, year, paperNumber, description || null],
  );
  return result.rows[0].id;
};

const resolveTopics = (topicRefs = [], lookup = new Map()) => {
  const resolved = [];
  const seen = new Set();
  topicRefs.forEach((ref) => {
    if (!ref) return;
    const byCode = lookup.get(String(ref).toUpperCase());
    const byName = lookup.get(String(ref).toLowerCase());
    const topic = byCode || byName;
    if (topic && !seen.has(topic.id)) {
      seen.add(topic.id);
      resolved.push(topic);
    }
  });
  return resolved;
};

const upsertQuestion = async (client, paperId, questionDef, topicLookup) => {
  const resolvedTopics = resolveTopics(questionDef.topicRefs, topicLookup);
  const questionTopic =
    questionDef.topic ||
    questionDef.topicLabel ||
    (resolvedTopics.length ? resolvedTopics[0].name : null);

  const result = await client.query(
    `INSERT INTO Questions_Table (paper_id, question_number, stem, explanation, topic, difficulty)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (paper_id, question_number) DO UPDATE
     SET stem = EXCLUDED.stem,
         explanation = EXCLUDED.explanation,
         topic = EXCLUDED.topic,
         difficulty = EXCLUDED.difficulty
     RETURNING id`,
    [
      paperId,
      questionDef.number,
      questionDef.stem,
      questionDef.explanation || null,
      questionTopic || null,
      questionDef.difficulty || null,
    ],
  );

  const questionId = result.rows[0].id;

  await client.query('DELETE FROM Answer_Options_Table WHERE question_id = $1', [questionId]);
  for (const option of questionDef.options || []) {
    await client.query(
      `INSERT INTO Answer_Options_Table (question_id, label, text, is_correct)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (question_id, label) DO UPDATE
       SET text = EXCLUDED.text,
           is_correct = EXCLUDED.is_correct`,
      [questionId, option.label, option.text, Boolean(option.isCorrect)],
    );
  }

  await client.query('DELETE FROM Question_Topics_Table WHERE question_id = $1', [questionId]);
  for (const topic of resolvedTopics) {
    await client.query(
      `INSERT INTO Question_Topics_Table (question_id, topic_id)
       VALUES ($1, $2)
       ON CONFLICT (question_id, topic_id) DO NOTHING`,
      [questionId, topic.id],
    );
  }

  return questionId;
};

const seedSubject = async (client, examLevelId, subjectDef) => {
  const subjectId = await upsertSubject(client, examLevelId, subjectDef);
  const topicLookup = await upsertTopics(client, subjectId, subjectDef.topics);

  for (const paper of subjectDef.papers || []) {
    const paperId = await upsertPaper(client, subjectId, paper);
    for (const question of paper.questions || []) {
      await upsertQuestion(client, paperId, question, topicLookup);
    }
  }
};

const seedExamLevel = async (client, examDef) => {
  const examLevelId = await upsertExamLevel(client, examDef.examLevel);
  for (const subject of examDef.subjects || []) {
    await seedSubject(client, examLevelId, subject);
  }
};

const seed = async () => {
  await runMigrations();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const exam of seedData) {
      await seedExamLevel(client, exam);
    }
    await client.query('COMMIT');
    console.log('Sample BECE & WASSCE data seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
