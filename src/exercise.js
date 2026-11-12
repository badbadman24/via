'use strict';



function exercise(options = {}) {
  const enabled = options.enabled === true && process.env.VIA_EXERCISE_ENABLED === 'true';
  const stream = options.stream || process.stdout;

  return function viaExercise(req, res, next) {
    if (!enabled) return next();

    const started = process.hrtime.bigint();
    const method = req.method;
    const path = (req.originalUrl || req.url || '/').split('?')[0];

    res.once('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - started) / 1e6;

      const event = {
        event: 'exercise_http_transaction',
        method,
        path,
        status: res.statusCode,
        durationMs: Number(durationMs.toFixed(3)),
      };

      stream.write(JSON.stringify(event) + '\n');
    });

    next();
  };
}

module.exports = exercise;
