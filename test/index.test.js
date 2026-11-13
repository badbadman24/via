const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const request = require('supertest');
const via = require('../src/index.js');

function makeApp(mwOpts, routeHandler) {
  const app = express();
  app.use(via(mwOpts));
  app.get('/hello', (req, res) => {
    res.status(200).send(routeHandler ? routeHandler(req, res) : 'hi');
  });
  app.get('/skipme', (req, res) => res.status(204).end());
  return app;
}

test('default logs request line with status and response time', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = makeApp({ stream, colors: false });
  const res = await request(app).get('/hello').expect(200);
  assert.equal(res.text, 'hi');
  const out = chunks.join('');
  assert.match(out, /GET \/hello 200/);
  assert.match(out, /ms/);
});

test('json format emits valid JSON with fields', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = makeApp({ format: 'json', stream, colors: false });
  await request(app).get('/hello?x=1').expect(200);
  const obj = JSON.parse(chunks.join('').trim());
  assert.equal(obj.method, 'GET');
  assert.equal(obj.url, '/hello?x=1');
  assert.equal(obj.status, 200);
  assert.equal(obj.responseTime >= 0, true);
  assert.equal(typeof obj.remoteAddr, 'string');
});

test('custom format string uses tokens', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = makeApp({ format: ':method :url :status :res[content-length]', stream, colors: false });
  await request(app).get('/hello').expect(200);
  const out = chunks.join('').trim();
  assert.equal(out, 'GET /hello 200 2');
});

test('skip function prevents logging', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = makeApp({ stream, colors: false, skip: (req) => req.path === '/skipme' }, null);
  // add route handled by makeApp skipme
  await request(app).get('/skipme').expect(204);
  await request(app).get('/hello').expect(200);
  const out = chunks.join('');
  assert.doesNotMatch(out, /skipme/);
  assert.match(out, /hello/);
});

test('custom token registered globally works', async () => {
  via.token('reqid', (req) => req.headers['x-request-id'] || 'none');
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = express();
  app.use(via({ format: ':method :url :reqid', stream, colors: false }));
  app.get('/hello', (req, res) => res.send('hi'));
  await request(app).get('/hello').set('X-Request-Id', 'abc-123').expect(200);
  assert.match(chunks.join(''), /abc-123/);
});

test('function format via options.format', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = express();
  app.use(via({
    format: (token, req, res) => `${token('method')} ${token('status')} custom`,
    stream,
    colors: false,
  }));
  app.get('/hello', (req, res) => res.send('hi'));
  await request(app).get('/hello').expect(200);
  assert.match(chunks.join(''), /GET 200 custom/);
});

test('immediate logs before response', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = express();
  app.use(via({ format: 'dev', stream, colors: false, immediate: true }));
  app.get('/hello', (req, res) => res.send('hi'));
  await request(app).get('/hello').expect(200);
  assert.ok(chunks.length >= 1);
});

test('combined format includes user-agent and referrer', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = express();
  app.use(via({ format: 'combined', stream, colors: false }));
  app.get('/hello', (req, res) => res.send('hi'));
  await request(app).get('/hello').set('User-Agent', 'TestAgent/1.0').set('Referer', 'http://example.com/').expect(200);
  const out = chunks.join('');
  assert.match(out, /TestAgent\/1.0/);
  assert.match(out, /http:\/\/example.com\//);
});

test('req[header] and res[header] tokens', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = express();
  app.use(via({ format: ':req[x-custom] :res[x-out]', stream, colors: false }));
  app.get('/hello', (req, res) => { res.set('X-Out', 'outval'); res.send('hi'); });
  await request(app).get('/hello').set('X-Custom', 'inval').expect(200);
  assert.match(chunks.join(''), /inval outval/);
});

test('date token clf and iso', async () => {
  const chunks = [];
  const stream = { write: (s) => { chunks.push(s); return true; }, isTTY: false };
  const app = express();
  app.use(via({ format: ':date[clf] :date[iso]', stream, colors: false }));
  app.get('/hello', (req, res) => res.send('hi'));
  await request(app).get('/hello').expect(200);
  const out = chunks.join('');
  assert.match(out, /\d{2}\/\w{3}\/\d{4}/);
  assert.match(out, /\d{4}-\d{2}-\d{2}T/);
});

test('via integrates opt-in exercise transaction observer without recording secrets', async () => {
  const previous = process.env.VIA_EXERCISE_ENABLED;
  process.env.VIA_EXERCISE_ENABLED = 'true';

  try {
    const normalChunks = [];
    const exerciseChunks = [];
    const app = express();

    app.use(express.text());
    app.use(via({
      format: 'dev',
      stream: { write: (line) => { normalChunks.push(line); return true; } },
      colors: false,
      exercise: {
        enabled: true,
        stream: { write: (line) => { exerciseChunks.push(line); return true; } },
      },
    }));

    app.post('/exercise-login', (req, res) => {
      res.status(201).send('synthetic-response-secret');
    });

    await request(app)
      .post('/exercise-login?synthetic=query-secret')
      .set('Authorization', 'Bearer synthetic-header-secret')
      .send('password=synthetic-body-secret')
      .expect(201);

    assert.equal(exerciseChunks.length, 1);
    const event = JSON.parse(exerciseChunks[0]);

    assert.equal(event.event, 'exercise_http_transaction');
    assert.equal(event.method, 'POST');
    assert.equal(event.path, '/exercise-login');
    assert.equal(event.status, 201);
    assert.equal(event.responseCompleted, true);
    assert.equal(typeof event.durationMs, 'number');

    const exerciseLog = exerciseChunks.join('');
    assert.doesNotMatch(
      exerciseLog,
      /synthetic-(?:query|header|body|response)-secret/
    );

    assert.match(normalChunks.join(''), /POST \/exercise-login/);
  } finally {
    if (previous === undefined) {
      delete process.env.VIA_EXERCISE_ENABLED;
    } else {
      process.env.VIA_EXERCISE_ENABLED = previous;
    }
  }
});
