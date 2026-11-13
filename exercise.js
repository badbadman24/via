'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const via = require('./src/index.js');

const app = express();
const enabled = process.env.VIA_EXERCISE_ENABLED === 'true';

// Landing page shown when the exercise is enabled: the ANON//LEARNING_NODE
// security-quotes page (served from demo/public/index.html).
const LANDING_PATH = path.join(__dirname, 'demo', 'public', 'index.html');
let LANDING_HTML = '';
try {
  LANDING_HTML = fs.readFileSync(LANDING_PATH, 'utf8');
} catch (_) {
  LANDING_HTML =
    '<h1>ANON//LEARNING_NODE</h1><p>Landing page asset not found.</p>';
}

app.use(via.exercise({
  enabled,
}));

app.get('/', (req, res) => {
  if (!enabled) {
    return res.send('<h1>VIA Exercise</h1><p>Normal application mode.</p>');
  }

  res.set('Cache-Control', 'no-store');
  res.type('html').send(LANDING_HTML);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', exerciseMode: enabled });
});

const port = Number(process.env.PORT || 3000);

app.listen(port, '127.0.0.1', () => {
  console.log(`VIA exercise service listening on http://127.0.0.1:${port}`);
  console.log(`Exercise mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
});
