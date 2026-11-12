'use strict';

const express = require('express');
const via = require('./src/index.js');

const app = express();
const enabled = process.env.VIA_EXERCISE_ENABLED === 'true';

app.use(via.exercise({
  enabled,
}));

app.get('/', (req, res) => {
  if (!enabled) {
    return res.send('<h1>VIA Exercise</h1><p>Normal application mode.</p>');
  }

  res.send(`
    <h1>WEBSITE SEIZED — DCO HUNT TEAM</h1>
    <h2>APT GHOSTFIRE CYBER EXERCISE</h2>
    <p>This website has been seized by the DCO HUNT TEAM.</p>
    <strong>AUTHORIZED CYBER EXERCISE — NOT AN ACTUAL SEIZURE.</strong>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', exerciseMode: enabled });
});

const port = Number(process.env.PORT || 3000);

app.listen(port, '127.0.0.1', () => {
  console.log(`VIA exercise service listening on http://127.0.0.1:${port}`);
  console.log(`Exercise mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
});
