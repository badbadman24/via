'use strict';

function createObserver(options = {}) {
  const enabled =
    options.enabled === true &&
    process.env.VIA_EXERCISE_ENABLED === 'true';
  const stream = options.stream || process.stdout;

  return function observe(req, res) {
    if (!enabled) return;

    const started = process.hrtime.bigint();
    const method = req.method;
    const path = (req.originalUrl || req.url || '/').split('?')[0];
    let logged = false;

    const record = (responseCompleted) => {
      if (logged) return;
      logged = true;

      const durationMs =
        Number(process.hrtime.bigint() - started) / 1e6;

      const event = {
        event: 'exercise_http_transaction',
        method,
        path,
        status: res.statusCode,
        durationMs: Number(durationMs.toFixed(3)),
        responseCompleted,
      };

      try {
        stream.write(JSON.stringify(event) + '\n');
      } catch (_) {
        // Exercise telemetry must never interrupt the application response.
      }
    };

    res.once('finish', () => record(true));
    res.once('close', () => {
      if (!res.writableEnded) record(false);
    });
  };
}

function exercise(options = {}) {
  const observe = createObserver(options);

  return function viaExercise(req, res, next) {
    observe(req, res);
    return next();
  };
}

exercise.createObserver = createObserver;

module.exports = exercise;
