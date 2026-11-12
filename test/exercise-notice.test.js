const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const mountExerciseNotice = require('../examples/exercise-notice');

test('exercise notice is not mounted without explicit approval', async () => {
  const previous = process.env.EXERCISE_NOTICE_ENABLED;
  delete process.env.EXERCISE_NOTICE_ENABLED;

  try {
    const app = express();
    app.get('/', (_req, res) => res.send('Normal homepage'));

    assert.equal(mountExerciseNotice(app), false);

    await request(app).get('/').expect(200, 'Normal homepage');
    await request(app).get('/exercise-notice').expect(404);
  } finally {
    if (previous === undefined) {
      delete process.env.EXERCISE_NOTICE_ENABLED;
    } else {
      process.env.EXERCISE_NOTICE_ENABLED = previous;
    }
  }
});

test('exercise notice is available only when explicitly enabled', async () => {
  const previous = process.env.EXERCISE_NOTICE_ENABLED;
  process.env.EXERCISE_NOTICE_ENABLED = 'true';

  try {
    const app = express();
    app.get('/', (_req, res) => res.send('Normal homepage'));

    assert.equal(mountExerciseNotice(app), true);

    await request(app)
      .get('/exercise-notice')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect(/WEBSITE SEIZED — DCO HUNT TEAM/)
      .expect(/APT GHOSTFIRE CYBER EXERCISE/)
      .expect(/NOT AN ACTUAL SEIZURE/);

    await request(app).get('/').expect(200, 'Normal homepage');
  } finally {
    if (previous === undefined) {
      delete process.env.EXERCISE_NOTICE_ENABLED;
    } else {
      process.env.EXERCISE_NOTICE_ENABLED = previous;
    }
  }
});
