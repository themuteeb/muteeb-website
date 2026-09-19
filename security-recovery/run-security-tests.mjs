// ============================================================================
// security-recovery/run-security-tests.mjs
// ----------------------------------------------------------------------------
// Security regression suite for muteeb.in — 25 tests, all must pass.
//
//   npm ci          (once, needs network)
//   node security-recovery/run-security-tests.mjs
//
// The suite runs the REAL api/*.js Vercel handlers in-process against an
// in-memory Supabase (PostgREST + Storage) emulated over a stubbed
// global fetch — no live Supabase project, no network, no keys required.
//
// What it guards (the "security recovery" invariants):
//   1.  every mutation, PII read, and storage write requires admin auth
//   2.  admin auth is constant-time and fails closed when env is unset
//   3.  no PII (sender e-mails) or secrets (admin_passcode) ever leak
//   4.  public inputs are validated: lengths, e-mail format, whitelists,
//       http(s)-only URLs (no javascript: injection), no path traversal
//   5.  CORS never reflects unknown origins (no `*` on the data API)
//   6.  500s never echo internals; unknown columns can't be mass-assigned
//   7.  thought likes are a single atomic UPDATE (no read-modify-write)
// ============================================================================

// ---------------------------------------------------------------------------
// Environment — must be set BEFORE the handler modules are imported, because
// the Supabase clients are created at module-load time.
// ---------------------------------------------------------------------------
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.ADMIN_PASSWORD = 'correct-admin-pass';
process.env.FULLSTACK_PROJECT_REF = '';      // keep the disaster-restore path inert
process.env.FULLSTACK_RESTORE_API_URL = '';
process.env.CORS_ALLOWED_ORIGINS = '';

const BASE = 'https://test-project.supabase.co';
const SERVICE_KEY = 'test-service-role-key';

// ---------------------------------------------------------------------------
// In-memory Supabase (PostgREST + Storage) behind a stubbed global fetch.
// ---------------------------------------------------------------------------
const db = {
  tables: {},   // table -> rows[]
  seq: {},      // table -> last issued id
  storage: {},  // 'folder/file' -> { contentType, bytes }
  calls: [],    // every outbound request, for audit assertions
};

const TABLE_DEFAULTS = {
  guestbook: { handle: '@guest', avatar_color: 'cyan', badge: 'VISITOR', approved: false },
  messages: { read_status: false },
  projects: { category: 'PERSONAL', featured: false, display_order: 0 },
  skills: { category: 'LANGUAGES & TOOLS', level: 85, display_order: 0 },
  thoughts: { read_time: '3 MIN READ', likes_count: 0, featured: false },
};

function makeRow(table, p) {
  db.seq[table] = (db.seq[table] || 0) + 1;
  return {
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...(TABLE_DEFAULTS[table] || {}),
    ...p,
    id: db.seq[table],
  };
}

function resetDb(seed = {}) {
  db.tables = {};
  db.seq = {};
  db.storage = {};
  db.calls = [];
  for (const [table, rows] of Object.entries(seed)) {
    let next = 0;
    db.tables[table] = rows.map((r) => {
      const row = { created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z', ...r };
      if (row.id === undefined) row.id = ++next;
      next = Math.max(next, row.id);
      return row;
    });
    db.seq[table] = next;
  }
}

function jsonRes(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const PGRST_NO_ROWS = () =>
  jsonRes(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });

function matchParams(row, params) {
  for (const [key, val] of params.entries()) {
    if (key === 'select' || key === 'order' || key === 'limit') continue;
    const [op, ...rest] = val.split('.');
    if (op === 'eq' && String(row[key]) === rest.join('.')) continue;
    return false;
  }
  return true;
}

function orderBy(rows, order) {
  const specs = order.split(',').map((s) => s.trim().split('.')).filter((s) => s.length);
  for (let i = specs.length - 1; i >= 0; i--) {
    const [col, dir] = specs[i];
    rows.sort((a, b) => {
      const x = a[col];
      const y = b[col];
      const c = x < y ? -1 : x > y ? 1 : 0;
      return dir && dir.startsWith('desc') ? -c : c;
    });
  }
  return rows;
}

/** PostgREST arithmetic in update payloads: {"likes_count": "inc 1"}. */
function applyUpdates(row, updates) {
  for (const [k, v] of Object.entries(updates)) {
    if (typeof v === 'string' && /^inc -?\d+$/.test(v)) row[k] = (row[k] || 0) + Number(v.slice(3));
    else if (typeof v === 'string' && /^dec -?\d+$/.test(v)) row[k] = (row[k] || 0) - Number(v.slice(3));
    else row[k] = v;
  }
}

function handleRest(table, query, method, headers, body) {
  const params = new URLSearchParams(query);
  const rows = db.tables[table] || [];
  const wantsObject = (headers.accept || '').includes('vnd.pgrst.object+json');
  const wantRepr = (headers.prefer || '').includes('return=representation');
  const matched = rows.filter((r) => matchParams(r, params));

  if (method === 'GET') {
    let out = [...matched];
    if (params.get('order')) out = orderBy(out, params.get('order'));
    if (params.get('limit')) out = out.slice(0, Number(params.get('limit')));
    if (wantsObject) {
      if (out.length !== 1) return PGRST_NO_ROWS();
      return jsonRes(200, out[0]);
    }
    return jsonRes(200, out);
  }

  if (method === 'POST') {
    let payload = JSON.parse(String(body));
    if (!Array.isArray(payload)) payload = [payload];
    const inserted = payload.map((p) => makeRow(table, p));
    db.tables[table] = [...rows, ...inserted];
    if (!wantRepr) return new Response(null, { status: 204 });
    if (wantsObject) return jsonRes(201, inserted.length === 1 ? inserted[0] : inserted);
    return jsonRes(201, inserted);
  }

  if (method === 'PATCH') {
    const updates = JSON.parse(String(body));
    const updated = matched.map((r) => {
      applyUpdates(r, updates);
      return r;
    });
    if (!wantRepr) return new Response(null, { status: 204 });
    if (wantsObject) {
      if (updated.length !== 1) return PGRST_NO_ROWS();
      return jsonRes(200, updated[0]);
    }
    return jsonRes(200, updated);
  }

  if (method === 'DELETE') {
    db.tables[table] = rows.filter((r) => !matched.includes(r));
    if (!wantRepr) return new Response(null, { status: 204 });
    if (wantsObject) {
      if (matched.length !== 1) return PGRST_NO_ROWS();
      return jsonRes(200, matched[0]);
    }
    return jsonRes(200, matched);
  }

  return jsonRes(405, { message: `method ${method} not allowed` });
}

function handleStorage(isPublic, rawPath, method, headers, body) {
  if (method === 'DELETE') {
    // storage-js removes via DELETE /object/<bucket> with { prefixes: [...] }
    // (older clients used comma-joined paths in the URL — support both).
    let targets = [];
    if (body && String(body).trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(String(body));
        if (Array.isArray(parsed.prefixes)) targets = parsed.prefixes;
      } catch { /* fall through to URL-based */ }
    }
    if (targets.length === 0 && rawPath) targets = decodeURIComponent(rawPath).split(',').filter(Boolean);
    targets.forEach((p) => delete db.storage[p]);
    return jsonRes(200, { moved: [], removed: targets });
  }

  const path = decodeURIComponent(rawPath);
  if (method === 'POST') {
    const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body ?? '');
    db.storage[path] = {
      contentType: headers['content-type'] || 'application/octet-stream',
      bytes,
    };
    return jsonRes(200, { Key: `images/${path}` });
  }
  if (method === 'GET' && isPublic) {
    const stored = db.storage[path];
    if (!stored) return jsonRes(404, { message: 'Object not found' });
    return new Response(stored.bytes, {
      status: 200,
      headers: { 'content-type': stored.contentType },
    });
  }
  return new Response(null, { status: 204 });
}

globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : String(input.url);
  const method = String(init.method || 'GET').toUpperCase();
  const rawHeaders = init.headers || (typeof input === 'object' && input.headers) || {};
  const headers = {};
  for (const [k, v] of new Headers(rawHeaders).entries()) headers[k.toLowerCase()] = v;

  if (url.startsWith(`${BASE}/rest/v1/`) || url.startsWith(`${BASE}/storage/v1/`)) {
    db.calls.push({ method, url, headers, body: init.body });
  }

  // The service-role key is the ONLY key these functions may present.
  if (headers.apikey !== SERVICE_KEY) {
    return jsonRes(401, { message: 'No valid API key found in request headers.' });
  }

  const rest = url.match(new RegExp(`^${BASE}/rest/v1/([a-z_]+)(?:\\?(.*))?$`));
  if (rest) return handleRest(rest[1], rest[2] || '', method, headers, init.body);

  const sto = url.match(new RegExp(`^${BASE}/storage/v1/object/(public/)?(images)(?:/(.*))?$`));
  if (sto) return handleStorage(Boolean(sto[1]), sto[3] || '', method, headers, init.body);

  return jsonRes(500, { message: `unexpected url: ${url}` });
};

// ---------------------------------------------------------------------------
// Import the REAL modules under test (after env + fetch are in place).
// ---------------------------------------------------------------------------
let sec;
let profileHandler, projectsHandler, skillsHandler, thoughtsHandler,
    guestbookHandler, messagesHandler, uploadHandler;
try {
  sec = await import('../api/_security.js');
  profileHandler = (await import('../api/profile.js')).default;
  projectsHandler = (await import('../api/projects.js')).default;
  skillsHandler = (await import('../api/skills.js')).default;
  thoughtsHandler = (await import('../api/thoughts.js')).default;
  guestbookHandler = (await import('../api/guestbook.js')).default;
  messagesHandler = (await import('../api/messages.js')).default;
  uploadHandler = (await import('../api/upload.js')).default;
} catch (err) {
  console.error(`Failed to import the API modules: ${err.message}`);
  console.error('Did you run `npm ci` first?');
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Tiny harness: Vercel-style req/res + assertions + test runner.
// ---------------------------------------------------------------------------
const ADMIN = { 'x-admin-auth': 'correct-admin-pass' };
const WRONG_ADMIN = { 'x-admin-auth': 'totally-wrong-pass' };

function call(handler, { method = 'GET', body, headers = {}, origin } = {}) {
  const reqHeaders = {};
  for (const [k, v] of Object.entries(headers)) reqHeaders[k.toLowerCase()] = v;
  if (origin) reqHeaders.origin = origin;
  const req = { method, headers: reqHeaders, body, query: {} };

  const res = {
    statusCode: 200,
    headersOut: {},
    jsonBody: undefined,
    setHeader(k, v) { this.headersOut[k.toLowerCase()] = v; return this; },
    status(c) { this.statusCode = c; return this; },
    json(d) { this.jsonBody = d; return this; },
    end() { return this; },
  };
  return Promise.resolve(handler(req, res)).then(() => res);
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}
function assertEqual(actual, expected, msg) {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${msg || 'assertEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}
function assertDeepEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${msg || 'assertDeepEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

let passed = 0;
let failed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (err) {
    failed += 1;
    failures.push({ name, err });
    console.log(`  FAIL ${name}\n       ${err.stack.split('\n').slice(0, 3).join('\n       ')}`);
  }
}

// ============================================================================
// The 25 tests
// ============================================================================
console.log('security-recovery suite — 25 tests\n');

// ---------------------------------------------------------------- helpers ---

await test('1. admin auth: missing X-Admin-Auth header is unauthorized', async () => {
  assert(!sec.isAdminRequest({ headers: {} }), 'empty headers must be unauthorized');
  assert(!sec.isAdminRequest({}), 'request without headers object must be unauthorized');
  assert(!sec.isAdminRequest(null), 'null request must be unauthorized');
  assert(!sec.isAdminRequest({ headers: { 'x-admin-auth': '' } }), 'empty header must be unauthorized');
});

await test('2. admin auth: wrong passcode is unauthorized', async () => {
  assert(!sec.isAdminRequest({ headers: WRONG_ADMIN }), 'wrong passcode must be rejected');
  assert(!sec.isAdminRequest({ headers: { 'x-admin-auth': 'correct-admin-pas' } }), 'prefix of passcode must be rejected');
});

await test('3. admin auth: correct passcode is authorized', async () => {
  assert(sec.isAdminRequest({ headers: ADMIN }), 'correct passcode must be accepted');
});

await test('4. admin auth: fails closed when ADMIN_PASSWORD env is unset', async () => {
  const prev = process.env.ADMIN_PASSWORD;
  try {
    delete process.env.ADMIN_PASSWORD;
    assert(!sec.isAdminRequest({ headers: ADMIN }), 'must not be admin when env is unset');
    process.env.ADMIN_PASSWORD = '';
    assert(!sec.isAdminRequest({ headers: ADMIN }), 'must not be admin when env is empty');
  } finally {
    process.env.ADMIN_PASSWORD = prev;
  }
});

await test('5. constant-time compare: no length leak, safe on odd inputs', async () => {
  assertEqual(sec.timingSafeStrEqual('abc', 'abc'), true, 'equal strings');
  assertEqual(sec.timingSafeStrEqual('abc', 'abd'), false, 'last byte differs');
  assertEqual(sec.timingSafeStrEqual('abc', 'abcd'), false, 'different lengths (no throw)');
  assertEqual(sec.timingSafeStrEqual('', ''), true, 'two empty strings');
  assertEqual(sec.timingSafeStrEqual('abc', null), false, 'null input');
  assertEqual(sec.timingSafeStrEqual(123, '123'), false, 'non-string input');
});

await test('6. cleanText: trims, strips control chars, enforces length', async () => {
  assertEqual(sec.cleanText('  hi there  ', 10), 'hi there', 'trim');
  assertEqual(sec.cleanText('a\u0000b\u001fc\u007fd', 10), 'abcd', 'control chars stripped');
  assertEqual(sec.cleanText('x'.repeat(11), 10), null, 'too long');
  assertEqual(sec.cleanText('   ', 10), null, 'empty after trim');
  assertEqual(sec.cleanText(42, 10), null, 'non-string');
  assertEqual(sec.cleanText('ok', 2), 'ok', 'exact length ok');
});

await test('7. e-mail validation: real formats accepted, junk rejected', async () => {
  assert(sec.isValidEmail('muteeb@example.com'), 'plain address');
  assert(sec.isValidEmail('a.b+c@sub.domain.co'), 'dotted local + TLD');
  assert(!sec.isValidEmail('nope'), 'no @');
  assert(!sec.isValidEmail('a@b'), 'no TLD');
  assert(!sec.isValidEmail('a b@c.de'), 'whitespace inside');
  assert(!sec.isValidEmail(''), 'empty');
  assert(!sec.isValidEmail(123), 'non-string');
  assert(!sec.isValidEmail('x@y.z'.repeat(50)), 'over 200 chars');
});

await test('8. body parsing: 413 oversized, 400 malformed/array/missing', async () => {
  let r = sec.parseBody({ body: { a: 1 } });
  assert(r.ok && r.body.a === 1, 'object body passes');
  r = sec.parseBody({ body: '{"a":2}' });
  assert(r.ok && r.body.a === 2, 'string JSON body parses');
  r = sec.parseBody({ body: '{nope' });
  assert(!r.ok && r.status === 400, 'malformed JSON -> 400');
  r = sec.parseBody({ body: [1, 2] });
  assert(!r.ok && r.status === 400, 'array body -> 400');
  r = sec.parseBody({ body: null });
  assert(!r.ok && r.status === 400, 'missing body -> 400');
  r = sec.parseBody({ body: 'x'.repeat(sec.MAX_BODY_BYTES + 1) });
  assert(!r.ok && r.status === 413, 'oversized body -> 413');
});

await test('9. CORS: no wildcard, unknown origins get no headers / 403 preflight', async () => {
  assertDeepEqual(sec.corsHeaders({ headers: {} }), {}, 'same-origin: no CORS headers needed');
  assert(sec.isCorsAllowed({ headers: {} }), 'same-origin allowed');

  const allowed = sec.corsHeaders({ headers: { origin: 'https://muteeb.in' } });
  assertEqual(allowed['Access-Control-Allow-Origin'], 'https://muteeb.in', 'production origin echoed');
  assert(allowed['Access-Control-Allow-Origin'] !== '*', 'never `*`');

  assert(!sec.isCorsAllowed({ headers: { origin: 'https://evil.example.com' } }), 'unknown origin blocked');
  assertDeepEqual(sec.corsHeaders({ headers: { origin: 'https://evil.example.com' } }), {}, 'unknown origin gets no headers');

  const ok = await call(projectsHandler, { method: 'OPTIONS', origin: 'https://muteeb.in' });
  assertEqual(ok.statusCode, 204, 'allowed-origin preflight');
  const denied = await call(projectsHandler, { method: 'OPTIONS', origin: 'https://evil.example.com' });
  assertEqual(denied.statusCode, 403, 'unknown-origin preflight rejected');
  const same = await call(projectsHandler, { method: 'OPTIONS' });
  assertEqual(same.statusCode, 204, 'same-origin preflight ok');
});

// ----------------------------------------------------------------- profile ---

await test('10. profile GET (public): no passcode, no owner e-mail, no audit fields', async () => {
  resetDb({
    profile: [{
      id: 1, full_name: 'Baba Muteeb', email: 'owner@muteeb.in',
      admin_passcode: 'topsecret-passcode',
    }],
  });
  const r = await call(profileHandler, { method: 'GET' });
  assertEqual(r.statusCode, 200, 'status');
  assert(r.jsonBody, 'profile returned');
  assert(!('admin_passcode' in r.jsonBody), 'admin_passcode leaked to public');
  assert(!('email' in r.jsonBody), 'owner e-mail leaked to public');
  assert(!('created_at' in r.jsonBody), 'created_at leaked to public');
  assert(!('__admin_verified' in r.jsonBody), 'admin flag without auth');
  assertEqual(r.jsonBody.full_name, 'Baba Muteeb', 'public field intact');
});

await test('11. profile GET (admin): inbox fields + verification flag, still no passcode', async () => {
  resetDb({
    profile: [{
      id: 1, full_name: 'Baba Muteeb', email: 'owner@muteeb.in',
      admin_passcode: 'topsecret-passcode',
    }],
  });
  const r = await call(profileHandler, { method: 'GET', headers: ADMIN });
  assertEqual(r.statusCode, 200, 'status');
  assertEqual(r.jsonBody.__admin_verified, true, 'admin verified flag');
  assertEqual(r.jsonBody.email, 'owner@muteeb.in', 'owner sees own e-mail');
  assert(!('admin_passcode' in r.jsonBody), 'admin_passcode leaked even to admin');
});

await test('12. profile PUT: admin-only, whitelisted fields, passcode not writable', async () => {
  resetDb({
    profile: [{ id: 1, full_name: 'Baba Muteeb', admin_passcode: 'topsecret-passcode' }],
  });
  let r = await call(profileHandler, { method: 'PUT', body: { headline: 'Hacked' } });
  assertEqual(r.statusCode, 401, 'public PUT blocked');
  assertEqual(db.tables.profile[0].headline, undefined, 'public PUT must not mutate');

  r = await call(profileHandler, { method: 'PUT', headers: ADMIN, body: { headline: 'Ship more.' } });
  assertEqual(r.statusCode, 200, 'admin PUT ok');
  assertEqual(db.tables.profile[0].headline, 'Ship more.', 'whitelisted field updated');

  r = await call(profileHandler, { method: 'PUT', headers: ADMIN, body: { admin_passcode: 'evil', hacked: 1 } });
  assertEqual(r.statusCode, 400, 'non-whitelisted fields rejected');
  assertEqual(db.tables.profile[0].admin_passcode, 'topsecret-passcode', 'passcode immutable via API');
});

// ---------------------------------------------------------------- messages ---

await test('13. messages GET (public): 401 — inbox PII is owner-only', async () => {
  resetDb({
    messages: [{ id: 1, sender_name: 'Visitor', sender_email: 'visitor@spam.example', body: 'hi' }],
  });
  const r = await call(messagesHandler, { method: 'GET' });
  assertEqual(r.statusCode, 401, 'public inbox read blocked');
});

await test('14. messages GET (admin): returns inbox including sender e-mails', async () => {
  resetDb({
    messages: [{ id: 1, sender_name: 'Visitor', sender_email: 'visitor@spam.example', body: 'hi' }],
  });
  const r = await call(messagesHandler, { method: 'GET', headers: ADMIN });
  assertEqual(r.statusCode, 200, 'admin inbox read ok');
  assert(Array.isArray(r.jsonBody) && r.jsonBody.length === 1, 'one message');
  assertEqual(r.jsonBody[0].sender_email, 'visitor@spam.example', 'owner sees sender e-mail');
});

await test('15. messages POST (public contact form): validation + safe defaults', async () => {
  resetDb({});
  let r = await call(messagesHandler, { method: 'POST', body: { sender_name: 'A', sender_email: 'not-an-email', body: 'hi' } });
  assertEqual(r.statusCode, 400, 'invalid e-mail rejected');
  r = await call(messagesHandler, { method: 'POST', body: { sender_name: 'A', sender_email: 'a@b.co' } });
  assertEqual(r.statusCode, 400, 'missing body rejected');
  r = await call(messagesHandler, { method: 'POST', body: { sender_name: 'A', sender_email: 'a@b.co', body: 'x'.repeat(5001) } });
  assertEqual(r.statusCode, 400, 'oversized body rejected');

  r = await call(messagesHandler, { method: 'POST', body: { sender_name: '  Fan  ', sender_email: ' fan@fan.dev ', body: 'love it' } });
  assertEqual(r.statusCode, 201, 'valid message accepted');
  const row = db.tables.messages.find((m) => m.sender_email === 'fan@fan.dev');
  assert(row, 'row stored');
  assertEqual(row.sender_name, 'Fan', 'name trimmed');
  assertEqual(row.read_status, false, 'defaults to unread');
  assertEqual(row.subject, 'Portfolio Contact Inquiry', 'default subject');
});

await test('16. messages DELETE: admin-only, unauthenticated delete is a no-op', async () => {
  resetDb({
    messages: [{ id: 7, sender_name: 'A', sender_email: 'a@b.co', body: 'x' }],
  });
  let r = await call(messagesHandler, { method: 'DELETE', body: { id: 7 } });
  assertEqual(r.statusCode, 401, 'public delete blocked');
  assert(db.tables.messages.some((m) => m.id === 7), 'row must survive unauthenticated delete');

  r = await call(messagesHandler, { method: 'DELETE', headers: ADMIN, body: { id: 7 } });
  assertEqual(r.statusCode, 200, 'admin delete ok');
  assert(!db.tables.messages.some((m) => m.id === 7), 'row deleted');
});

// ----------------------------------------------------------------- projects ---

await test('17. projects: public mutations blocked (401, no-op), public GET works', async () => {
  resetDb({ projects: [{ id: 1, title: 'Original' }] });
  const before = JSON.stringify(db.tables.projects);
  let r = await call(projectsHandler, { method: 'POST', body: { title: 'Hacked' } });
  assertEqual(r.statusCode, 401, 'public POST blocked');
  r = await call(projectsHandler, { method: 'PUT', body: { id: 1, title: 'Hacked' } });
  assertEqual(r.statusCode, 401, 'public PUT blocked');
  r = await call(projectsHandler, { method: 'DELETE', body: { id: 1 } });
  assertEqual(r.statusCode, 401, 'public DELETE blocked');
  assertEqual(JSON.stringify(db.tables.projects), before, 'no mutation without auth');

  r = await call(projectsHandler, { method: 'GET' });
  assertEqual(r.statusCode, 200, 'public GET ok');
  assertEqual(r.jsonBody.length, 1, 'public reads the list');
});

await test('18. projects: admin CRUD with validation (title, http(s) URLs, lengths)', async () => {
  resetDb({});
  let r = await call(projectsHandler, { method: 'POST', headers: ADMIN, body: { title: 'Evil', live_url: 'javascript:alert(1)' } });
  assertEqual(r.statusCode, 400, 'javascript: URL rejected');
  r = await call(projectsHandler, { method: 'POST', headers: ADMIN, body: { live_url: 'https://x.dev' } });
  assertEqual(r.statusCode, 400, 'missing title rejected');
  r = await call(projectsHandler, { method: 'POST', headers: ADMIN, body: { title: 'P'.repeat(201) } });
  assertEqual(r.statusCode, 400, 'over-length title rejected');
  r = await call(projectsHandler, { method: 'POST', headers: ADMIN, body: { title: 'New', evil_col: 1 } });
  assertEqual(r.statusCode, 400, 'unknown column rejected');

  r = await call(projectsHandler, { method: 'POST', headers: ADMIN, body: { title: 'New Project', live_url: 'https://example.dev', tags: ['a', 'b'] } });
  assertEqual(r.statusCode, 201, 'valid create ok');
  const created = db.tables.projects.find((p) => p.title === 'New Project');
  assert(created, 'row exists');
  assertEqual(created.featured, false, 'default featured');
  assertEqual(created.display_order, 0, 'default display_order');

  r = await call(projectsHandler, { method: 'PUT', headers: ADMIN, body: { id: created.id, title: 'Renamed' } });
  assertEqual(r.statusCode, 200, 'admin PUT ok');
  assertEqual(db.tables.projects.find((p) => p.id === created.id).title, 'Renamed', 'updated');

  r = await call(projectsHandler, { method: 'DELETE', headers: ADMIN, body: { id: created.id } });
  assertEqual(r.statusCode, 200, 'admin DELETE ok');
  assert(!db.tables.projects.some((p) => p.id === created.id), 'row gone');
});

// ------------------------------------------------------------------- skills ---

await test('19. skills: public mutations blocked (401, no-op), public GET works', async () => {
  resetDb({ skills: [{ id: 1, name: 'React', level: 90 }] });
  const before = JSON.stringify(db.tables.skills);
  for (const [method, body] of [['POST', { name: 'Hack' }], ['PUT', { id: 1, level: 100 }], ['DELETE', { id: 1 }]]) {
    const r = await call(skillsHandler, { method, body });
    assertEqual(r.statusCode, 401, `public ${method} blocked`);
  }
  assertEqual(JSON.stringify(db.tables.skills), before, 'no mutation without auth');
  const r = await call(skillsHandler, { method: 'GET' });
  assertEqual(r.statusCode, 200, 'public GET ok');
  assertEqual(r.jsonBody.length, 1, 'public reads the list');
});

await test('20. skills: admin CRUD with validation (name, level 0-100)', async () => {
  resetDb({});
  let r = await call(skillsHandler, { method: 'POST', headers: ADMIN, body: { name: 'Rust', level: 150 } });
  assertEqual(r.statusCode, 400, 'level > 100 rejected');
  r = await call(skillsHandler, { method: 'POST', headers: ADMIN, body: { level: 50 } });
  assertEqual(r.statusCode, 400, 'missing name rejected');

  r = await call(skillsHandler, { method: 'POST', headers: ADMIN, body: { name: 'Rust', level: '70' } });
  assertEqual(r.statusCode, 201, 'valid create ok');
  const s = db.tables.skills.find((x) => x.name === 'Rust');
  assert(s, 'row exists');
  assertEqual(s.level, 70, 'numeric level stored');

  r = await call(skillsHandler, { method: 'PUT', headers: ADMIN, body: { id: s.id, level: 80 } });
  assertEqual(r.statusCode, 200, 'admin PUT ok');
  assertEqual(db.tables.skills.find((x) => x.id === s.id).level, 80, 'level updated');

  r = await call(skillsHandler, { method: 'DELETE', headers: ADMIN, body: { id: s.id } });
  assertEqual(r.statusCode, 200, 'admin DELETE ok');
  assert(!db.tables.skills.some((x) => x.id === s.id), 'row gone');
});

// ----------------------------------------------------------------- thoughts ---

await test('21. thoughts: public create/edit/delete blocked (401, no-op), public GET works', async () => {
  resetDb({ thoughts: [{ id: 1, title: 'T', likes_count: 5 }] });
  const before = JSON.stringify(db.tables.thoughts);
  let r = await call(thoughtsHandler, { method: 'POST', body: { title: 'spam' } });
  assertEqual(r.statusCode, 401, 'public create blocked');
  r = await call(thoughtsHandler, { method: 'PUT', body: { id: 1, title: 'hacked' } });
  assertEqual(r.statusCode, 401, 'public edit blocked');
  r = await call(thoughtsHandler, { method: 'DELETE', body: { id: 1 } });
  assertEqual(r.statusCode, 401, 'public delete blocked');
  assertEqual(JSON.stringify(db.tables.thoughts), before, 'no mutation without auth');

  r = await call(thoughtsHandler, { method: 'GET' });
  assertEqual(r.statusCode, 200, 'public GET ok');
  assertEqual(r.jsonBody.length, 1, 'public reads the list');
});

await test('22. thoughts PUT (admin): likes_count cannot be mass-assigned', async () => {
  resetDb({ thoughts: [{ id: 3, title: 'Deep', likes_count: 42 }] });
  const r = await call(thoughtsHandler, { method: 'PUT', headers: ADMIN, body: { id: 3, likes_count: 999999, summary: 'updated' } });
  assertEqual(r.statusCode, 400, 'likes_count rejected as unknown field');
  const row = db.tables.thoughts.find((t) => t.id === 3);
  assertEqual(row.likes_count, 42, 'likes_count untouched');
  assertEqual(row.summary, undefined, 'rejected PUT applies nothing');

  const ok = await call(thoughtsHandler, { method: 'PUT', headers: ADMIN, body: { id: 3, summary: 'updated' } });
  assertEqual(ok.statusCode, 200, 'whitelisted field updates fine');
  assertEqual(db.tables.thoughts.find((t) => t.id === 3).summary, 'updated', 'summary updated');
});

await test('23. thoughts like (public): ONE atomic UPDATE, no read-modify-write', async () => {
  resetDb({ thoughts: [{ id: 9, title: 'L', likes_count: 10 }] });
  db.calls.length = 0;

  const r = await call(thoughtsHandler, { method: 'POST', body: { action: 'like', id: 9 } });
  assertEqual(r.statusCode, 200, 'like ok');
  assertEqual(r.jsonBody.likes_count, 11, 'count incremented');

  const calls = db.calls.filter((c) => c.url.includes('/rest/v1/thoughts'));
  assertEqual(calls.length, 1, 'exactly one request for a like');
  assertEqual(calls[0].method, 'PATCH', 'like is an UPDATE, not GET-then-UPDATE');
  assertEqual(JSON.parse(calls[0].body).likes_count, 'inc 1', 'atomic inc payload');
  assert(calls[0].url.includes('id=eq.9'), 'targets the right row');

  let rb = await call(thoughtsHandler, { method: 'POST', body: { action: 'like', id: 'abc' } });
  assertEqual(rb.statusCode, 400, 'non-numeric id rejected');
  rb = await call(thoughtsHandler, { method: 'POST', body: { action: 'like', id: 123456 } });
  assertEqual(rb.statusCode, 404, 'missing thought -> 404');
});

// ---------------------------------------------------------------- guestbook ---

await test('24. guestbook: moderation + public-input whitelists + length caps', async () => {
  resetDb({
    guestbook: [
      { id: 1, name: 'Approved', message: 'hi', approved: true },
      { id: 2, name: 'Pending', message: 'yo', approved: false },
    ],
  });

  let r = await call(guestbookHandler, { method: 'GET' });
  assertEqual(r.statusCode, 200, 'public GET ok');
  assertEqual(r.jsonBody.length, 1, 'public sees approved only');
  assertEqual(r.jsonBody[0].id, 1, 'the approved entry');

  r = await call(guestbookHandler, { method: 'GET', headers: ADMIN });
  assertEqual(r.jsonBody.length, 2, 'admin sees all incl. pending');

  r = await call(guestbookHandler, { method: 'POST', body: { name: 'New fan', handle: 'fan', message: 'great site!', avatar_color: 'rose', badge: 'FRIEND' } });
  assertEqual(r.statusCode, 201, 'public post ok');
  assertEqual(r.jsonBody.approved, false, 'always starts in moderation');
  assertEqual(r.jsonBody.avatar_color, 'rose', 'whitelisted color kept');

  r = await call(guestbookHandler, { method: 'POST', body: { name: 'X', message: 'y', badge: 'ROOT', avatar_color: 'url(javascript:evil)' } });
  assertEqual(r.statusCode, 201, 'post accepted');
  assertEqual(r.jsonBody.badge, 'VISITOR', 'non-whitelisted badge falls back to default');
  assertEqual(r.jsonBody.avatar_color, 'cyan', 'non-whitelisted color falls back to default');

  r = await call(guestbookHandler, { method: 'POST', body: { name: 'X', message: 'x'.repeat(301) } });
  assertEqual(r.statusCode, 400, 'over-length message rejected');
  r = await call(guestbookHandler, { method: 'POST', body: { message: 'no name' } });
  assertEqual(r.statusCode, 400, 'missing name rejected');

  r = await call(guestbookHandler, { method: 'PUT', body: { id: 2, approved: true } });
  assertEqual(r.statusCode, 401, 'public approve blocked');
  assertEqual(db.tables.guestbook.find((g) => g.id === 2).approved, false, 'entry still pending');

  r = await call(guestbookHandler, { method: 'PUT', headers: ADMIN, body: { id: 2, approved: 'yes-please' } });
  assertEqual(r.statusCode, 400, 'non-boolean approved rejected');
  r = await call(guestbookHandler, { method: 'PUT', headers: ADMIN, body: { id: 2, approved: true } });
  assertEqual(r.statusCode, 200, 'admin approve ok');
  assertEqual(db.tables.guestbook.find((g) => g.id === 2).approved, true, 'entry approved');
});

// ------------------------------------------------------------------- upload ---

await test('25. upload: owner-only public-bucket writes (type/size/folder/path checks)', async () => {
  resetDb({});
  const png = Buffer.alloc(1024, 1).toString('base64');

  let r = await call(uploadHandler, { method: 'POST', body: { fileName: 'a.png', fileType: 'image/png', fileBase64: png } });
  assertEqual(r.statusCode, 401, 'public upload blocked');
  r = await call(uploadHandler, { method: 'DELETE', body: { path: 'general/123_a.png' } });
  assertEqual(r.statusCode, 401, 'public delete blocked');

  r = await call(uploadHandler, { method: 'POST', headers: ADMIN, body: { fileName: 'x.html', fileType: 'text/html', fileBase64: png } });
  assertEqual(r.statusCode, 415, 'non-image content-type rejected (no stored XSS in public bucket)');

  const big = 'A'.repeat(4_200_000); // decodes to > 3 MB
  r = await call(uploadHandler, { method: 'POST', headers: ADMIN, body: { fileName: 'big.png', fileType: 'image/png', fileBase64: 'data:image/png;base64,' + big } });
  assertEqual(r.statusCode, 413, 'oversized image rejected');

  r = await call(uploadHandler, { method: 'POST', headers: ADMIN, body: { fileName: 'a.png', fileType: 'image/png', fileBase64: png, folder: '../../etc' } });
  assertEqual(r.statusCode, 400, 'non-whitelisted folder rejected');

  r = await call(uploadHandler, { method: 'DELETE', headers: ADMIN, body: { path: '../secret/file.png' } });
  assertEqual(r.statusCode, 400, 'traversal path rejected');
  r = await call(uploadHandler, { method: 'DELETE', headers: ADMIN, body: { path: 'general/a.png/../../x' } });
  assertEqual(r.statusCode, 400, 'deep traversal path rejected');

  r = await call(uploadHandler, { method: 'POST', headers: ADMIN, body: { fileName: 'shot.png', fileType: 'image/png', fileBase64: 'data:image/png;base64,' + png, folder: 'projects' } });
  assertEqual(r.statusCode, 200, 'valid admin upload ok');
  assert(typeof r.jsonBody.url === 'string' && r.jsonBody.url.includes('/storage/v1/object/public/images/projects/'), 'public URL in images bucket');
  const storedKey = Object.keys(db.storage)[0];
  assert(storedKey && storedKey.startsWith('projects/'), 'stored under the requested folder');
  assertEqual(db.storage[storedKey].contentType, 'image/png', 'content-type stored as declared');

  r = await call(uploadHandler, { method: 'DELETE', headers: ADMIN, body: { path: storedKey } });
  assertEqual(r.statusCode, 200, 'valid admin delete ok');
  assert(!(storedKey in db.storage), 'object removed');
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('');
if (failed === 0) {
  console.log(`${passed} passed`);
  process.exit(0);
} else {
  console.log(`${passed} passed, ${failed} FAILED`);
  for (const f of failures) console.log(`  - ${f.name}`);
  process.exit(1);
}
