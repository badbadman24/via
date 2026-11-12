const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const exercise = require('../src/exercise');

test('exercise middleware stays disabled without explicit environment approval', async () => {
  const previous = process.env.VIA_EXERCISE_ENABLED;
  delete process.env.VIA_EXERCISE_ENABLED;

  try {
    const chunks = [];
    const app = express();

    app.use(exercise({
      enabled: true,
      stream: { write: (line) => chunks.push(line) },
    }));

    app.get('/demo', (req, res) => res.send('normal'));

    await request(app).get('/demo').expect(200);
    assert.equal(chunks.length, 0);
  } finally {
    if (previous === undefined) {
      delete process.env.VIA_EXERCISE_ENABLED;
    } else {
      process.env.VIA_EXERCISE_ENABLED = previous;
    }
  }
});

test('enabled exercise middleware logs response metadata only', async () => {
  const previous = process.env.VIA_EXERCISE_ENABLED;
  process.env.VIA_EXERCISE_ENABLED = 'true';

  try {
    const chunks = [];
    const app = express();

    app.use(exercise({
      enabled: true,
      stream: { write: (line) => chunks.push(line) },
    }));

    app.post('/demo', (req, res) => res.status(201).send('private-response'));

    await request(app)
      .post('/demo?token=secret')
      .set('Authorization', 'Bearer secret-token')
      .send('private-request-body')
      .expect(201);

    assert.equal(chunks.length, 1);

    const event = JSON.parse(chunks[0]);
    assert.equal(event.event, 'exercise_http_transaction');
    assert.equal(event.method, 'POST');
    assert.equal(event.path, '/demo');
    assert.equal(event.status, 201);
    assert.equal(typeof event.durationMs, 'number');

    assert.doesNotMatch(chunks[0], /secret|private-request-body|private-response/);
  } finally {
    if (previous === undefined) {
      delete process.env.VIA_EXERCISE_ENABLED;
    } else {
      process.env.VIA_EXERCISE_ENABLED = previous;
    }
  }
});
