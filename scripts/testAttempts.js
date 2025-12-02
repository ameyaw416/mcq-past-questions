#!/usr/bin/env node
/**
 * Smoke test for quiz attempt lifecycle.
 * Requires Node 18+ and QUIZ_EMAIL/QUIZ_PASSWORD env vars (any authenticated user).
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const QUIZ_EMAIL = process.env.QUIZ_EMAIL || process.env.ADMIN_EMAIL;
const QUIZ_PASSWORD = process.env.QUIZ_PASSWORD || process.env.ADMIN_PASSWORD;

if (!QUIZ_EMAIL || !QUIZ_PASSWORD) {
  console.error('Set QUIZ_EMAIL/QUIZ_PASSWORD (or ADMIN_EMAIL/ADMIN_PASSWORD) env vars.');
  process.exit(1);
}

const cookieJar = new Map();

const storeCookies = (headers) => {
  const raw = headers.raw?.()['set-cookie'] || headers.getSetCookie?.() || [];
  raw.forEach((cookieStr) => {
    const [cookiePart] = cookieStr.split(';');
    const [name, value] = cookiePart.split('=');
    if (name) cookieJar.set(name.trim(), (value || '').trim());
  });
};

const buildCookieHeader = () =>
  Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

const request = async (path, { method = 'GET', body, headers = {} } = {}) => {
  const mergedHeaders = { ...headers };
  const cookieHeader = buildCookieHeader();
  if (cookieHeader) mergedHeaders.Cookie = cookieHeader;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: mergedHeaders,
    body,
  });

  storeCookies(response.headers);

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse JSON from', path, 'payload:', text);
      throw err;
    }
  }

  if (!response.ok) {
    console.error(`Request to ${path} failed with status ${response.status}`);
    console.error(data);
    throw new Error(`Request failed: ${response.status}`);
  }

  return data;
};

const requestJson = (path, { method = 'POST', json }) =>
  request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  });

const run = async () => {
  console.log('Logging in...');
  await requestJson('/api/auth/login', {
    json: { email: QUIZ_EMAIL, password: QUIZ_PASSWORD },
  });

  console.log('Fetching subjects...');
  const subjectsResponse = await request('/api/catalog/subjects');
  const firstSubject = subjectsResponse.subjects && subjectsResponse.subjects[0];
  if (!firstSubject) {
    throw new Error('No subjects available to start a quiz.');
  }

  console.log('Starting attempt...');
  const attempt = await requestJson('/api/attempts', {
    json: {
      subjectId: firstSubject.id,
      numQuestions: 1,
      durationMinutes: 1,
    },
  });
  console.log('Attempt created:', attempt.attemptId);

  const answers = (attempt.questions || []).map((question) => ({
    questionId: question.id,
    optionId: question.options && question.options[0] ? question.options[0].id : null,
  }));

  console.log('Submitting attempt...');
  const submitResult = await requestJson(`/api/attempts/${attempt.attemptId}/submit`, {
    json: { answers },
  });
  console.log('Submit result:', submitResult);

  console.log('Fetching my attempts...');
  const myAttempts = await request('/api/attempts/my');
  console.log('My attempts count:', myAttempts.attempts?.length || 0);

  console.log('Fetching attempt review...');
  const review = await request(`/api/attempts/${attempt.attemptId}`);
  console.log('Review questions:', review.questions?.length || 0);

  console.log('Attempt smoke test complete.');
};

run().catch((err) => {
  console.error('Attempt smoke test failed:', err);
  process.exit(1);
});
