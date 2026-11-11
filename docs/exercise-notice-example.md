
# Controlled Cyber Exercise Notice

This guide demonstrates how an application owner can present a simulated exercise notice through an explicitly configured Express route.

## Important distinction

`@ironshieldph/via` is request/response logging middleware. It does not modify website pages, replace application routes, or display notices.

The example below belongs in the consuming application, not in the middleware's runtime implementation.

## Example: Explicitly enabled exercise route

```js
const express = require('express');
const via = require('@ironshieldph/via');

const app = express();

// Keep normal request logging enabled.
app.use(via('combined'));

// Enable only when explicitly configured by the application owner.
if (process.env.EXERCISE_NOTICE_ENABLED === 'true') {
  app.get('/exercise-notice', (req, res) => {
    res.status(200).type('html').send(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Cyber Exercise Notice</title>
        </head>
        <body>
          <main>
            <h1>CYBER EXERCISE NOTICE</h1>
            <h2>Simulated Security Incident</h2>
            <p>This page is part of an authorized cyber exercise.</p>
            <p>This is a simulation, not an actual website seizure.</p>
          </main>
        </body>
      </html>
    `);
  });
}
```

## Activation

The application owner must explicitly set:

`EXERCISE_NOTICE_ENABLED=true`

Restart the application using its approved deployment procedure, then visit `/exercise-notice`.

## Deactivation

Set the variable to `false` or remove it:

`EXERCISE_NOTICE_ENABLED=false`

Restart the application. The exercise route will no longer be registered.

## Testing and rollback

1. Test in a local or designated exercise environment first.
2. Confirm the notice is accessible only when explicitly enabled.
3. Confirm normal application routes remain unchanged.
4. Preserve the application's original configuration.
5. Disable the environment variable and restart to roll back.

## Scope and responsibility

This example does not authorize changes to a third-party application. The application owner is responsible for approving, integrating, testing, and deploying any exercise-related notice.

The `via` middleware remains a request/response logging component.
