#!/usr/bin/env node
/**
 * Smoke test for the import pipeline.
 * Requires Node 18+ for global fetch/FormData.
 * Requires ADMIN_EMAIL and ADMIN_PASSWORD env vars for admin login.
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to run this script.');
  process.exit(1);
}

const csvSample = `exam_level_code,subject_code,paper_year,paper_number,question_number,stem,option_a,option_b,option_c,option_d,correct_option,topic_codes
BECE,MATH,2030,1,101,"What is 2 + 2?",3,4,5,6,B,ALG
BECE,MATH,2030,1,102,"Find the area of a square with side 4 cm.",8,12,14,16,A,GEO`;

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

const request = async (path, { method = 'GET', headers = {}, body } = {}) => {
  const defaultHeaders = { ...headers };
  const cookieHeader = buildCookieHeader();
  if (cookieHeader) defaultHeaders.Cookie = cookieHeader;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: defaultHeaders,
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

const uploadCsv = (path) => {
  const form = new FormData();
  form.append('file', new Blob([csvSample], { type: 'text/csv' }), 'sample.csv');
  return request(path, { method: 'POST', body: form });
};

const run = async () => {
  console.log('Logging in as admin...');
  await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  console.log('Previewing import...');
  const previewResult = await uploadCsv('/api/admin/imports/preview');
  console.log('Preview result:', previewResult);

  console.log('Running actual import...');
  const importResult = await uploadCsv('/api/admin/imports');
  console.log('Import result:', importResult);

  console.log('Smoke test complete.');
};

run().catch((err) => {
  console.error('Import smoke test failed:', err);
  process.exit(1);
});
