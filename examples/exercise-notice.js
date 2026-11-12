'use strict';

const NOTICE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>APT GHOSTFIRE — Cyber Exercise</title>
</head>
<body>
  <main>
    <h1>WEBSITE SEIZED — DCO HUNT TEAM</h1>
    <h2>APT GHOSTFIRE CYBER EXERCISE</h2>
    <h3>SIMULATED SECURITY INCIDENT</h3>
    <p>This website has been seized by the DCO HUNT TEAM.</p>
    <p><strong>AUTHORIZED EXERCISE DEMONSTRATION — NOT AN ACTUAL SEIZURE.</strong></p>
  </main>
</body>
</html>`;

function mountExerciseNotice(app) {
  if (!app || typeof app.get !== 'function') {
    throw new TypeError('An Express-compatible application is required.');
  }

  if (process.env.EXERCISE_NOTICE_ENABLED !== 'true') {
    return false;
  }

  app.get('/exercise-notice', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).type('html').send(NOTICE_HTML);
  });

  return true;
}

module.exports = mountExerciseNotice;
