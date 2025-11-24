#!/usr/bin/env node
/**
 * Smoke test script for catalog CRUD endpoints.
 * Requires Node 18+ (for global fetch).
 * Needs ADMIN_EMAIL and ADMIN_PASSWORD environment variables set.
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
  process.exit(1);
}

const cookieJar = new Map();

const storeCookies = (headers) => {
  const raw = headers.raw?.()['set-cookie'] || headers.getSetCookie?.() || [];
  raw.forEach((cookieStr) => {
    const [cookiePart] = cookieStr.split(';');
    const [name, value] = cookiePart.split('=');
    if (name) {
      cookieJar.set(name.trim(), (value || '').trim());
    }
  });
};

const buildCookieHeader = () =>
  Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

const request = async (path, { method = 'GET', body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  const cookieHeader = buildCookieHeader();
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  storeCookies(response.headers);

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('Failed to parse JSON response for', path, text);
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

const run = async () => {
  console.log('Logging in as admin...');
  await request('/api/auth/login', {
    method: 'POST',
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });

  console.log('Creating exam level...');
  const examLevel = await request('/api/catalog/exam-levels', {
    method: 'POST',
    body: { code: `TEST-${Date.now()}`, name: 'Test Exam Level' },
  });
  console.log('Exam level created:', examLevel);

  console.log('Creating subject...');
  const subject = await request('/api/catalog/subjects', {
    method: 'POST',
    body: {
      examTypeId: examLevel.examLevel.id,
      name: 'Test Subject',
      code: `SUB-${Date.now()}`,
    },
  });
  console.log('Subject created:', subject);

  console.log('Creating topic...');
  const topic = await request('/api/catalog/topics', {
    method: 'POST',
    body: {
      subjectId: subject.subject.id,
      name: 'Test Topic',
      code: `TOP-${Date.now()}`,
      description: 'Temporary topic for smoke tests',
    },
  });
  console.log('Topic created:', topic);

  console.log('Creating paper...');
  const paper = await request('/api/catalog/papers', {
    method: 'POST',
    body: {
      subjectId: subject.subject.id,
      year: 2030,
      paperNumber: 1,
      description: 'Smoke test paper',
    },
  });
  console.log('Paper created:', paper);

  console.log('Fetching lists...');
  console.log(await request('/api/catalog/exam-levels'));
  console.log(await request('/api/catalog/subjects'));
  console.log(await request('/api/catalog/topics'));
  console.log(await request('/api/catalog/papers'));

  console.log('Updating resources...');
  await request(`/api/catalog/exam-levels/${examLevel.examLevel.id}`, {
    method: 'PUT',
    body: { code: `${examLevel.examLevel.code}-UPD`, name: 'Updated Exam Level' },
  });

  await request(`/api/catalog/subjects/${subject.subject.id}`, {
    method: 'PUT',
    body: {
      examTypeId: examLevel.examLevel.id,
      name: 'Updated Subject',
      code: `${subject.subject.code}-UPD`,
    },
  });

  await request(`/api/catalog/topics/${topic.topic.id}`, {
    method: 'PUT',
    body: {
      subjectId: subject.subject.id,
      name: 'Updated Topic',
      code: `${topic.topic.code}-UPD`,
      description: 'Updated description',
    },
  });

  await request(`/api/catalog/papers/${paper.paper.id}`, {
    method: 'PUT',
    body: {
      subjectId: subject.subject.id,
      year: 2031,
      paperNumber: 2,
      description: 'Updated smoke test paper',
    },
  });

  console.log('Deleting resources...');
  await request(`/api/catalog/papers/${paper.paper.id}`, { method: 'DELETE' });
  await request(`/api/catalog/topics/${topic.topic.id}`, { method: 'DELETE' });
  await request(`/api/catalog/subjects/${subject.subject.id}`, { method: 'DELETE' });
  await request(`/api/catalog/exam-levels/${examLevel.examLevel.id}`, { method: 'DELETE' });

  console.log('Smoke test completed successfully.');
};

run().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
