# @ironshieldph/via

Flexible, modern request/response logging middleware for **Express**.  
A drop-in replacement for `morgan` with a familiar token API plus structured JSON output, colorized dev mode, custom tokens, streams, and skip rules.

`@ironshieldph/via` is designed to sit in the Express (the **E** in **MEVN**) layer of a
MongoDB + Express + Vue + Node stack and give you full visibility into every request that
the Vue client (or any other consumer) makes against your API, and every response your
server sends back.

## Features

- Morgan-compatible predefined formats (`dev`, `combined`, `common`, `short`, `tiny`)
- Structured `json` output (one JSON object per line) for log aggregators
- Colorized, human-readable dev output (auto-detected TTY)
- Custom format strings and custom format functions
- Built-in and custom tokens
- Log on response `finish` (default) or immediately on request arrival
- Skip rules (health checks, static assets, preflight, etc.)
- Any writable stream destination (stdout, file, rotating file, etc.)
- Never breaks the response if logging throws
- ESM + CommonJS + TypeScript declarations

## Install

```bash
npm install @ironshieldph/via
```

Peer dependency: `express >= 4`. (Node `>= 16`.)

```bash
npm install express
```

## Quick start (Express backend)

```js
const express = require('express');
const via = require('@ironshieldph/via');

const app = express();

// Default "dev" format, colorized when stdout is a TTY
app.use(via());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.get('/api/hello', (req, res) => res.json({ message: 'hello' }));

app.listen(process.env.PORT || 3000, () => {
  console.log('API listening');
});


```

Every request now produces a line such as:

```
GET /api/hello 200 4.123 ms - 23
```

## How it works

`via(...)` returns a standard Express middleware `(req, res, next) => void`.

1. **Timer start** — on each request a high-resolution timer is stored on
   `req._viaStart` (`process.hrtime.bigint()`).
2. **Immediate mode** (`immediate: true`) — logs as soon as the request is received.
   Useful for "request received" tracing, but `:status` / response time are not yet final.
3. **Default mode** — registers listeners on `res.on('finish')` (and `res.on('close')`
   for aborted connections) and logs **once**, after the response has been sent. This is
   when `:status`, `:response-time`, `:res[...]` and friends are meaningful.
4. **Skip** — `skip(req, res)` is consulted both before immediate logging and inside
   `writeLog`, so a truthy result suppresses output.
5. **Safety** — any error thrown while formatting/writing is caught and written to the
   stream as a stack trace; the HTTP response is never interrupted.

Because logging happens on `finish`, the middleware can be mounted **before** your routes
and body parsers and still observe the final status code.

## MEVN integration

### Typical project layout

```
mevn-app/
├── client/                 # Vue 3 + Vite
│   ├── src/
│   │   └── services/api.js # axios instance
│   └── vite.config.js      # dev proxy -> Express
└── server/                 # Express + Node
    ├── index.js            # app entry (mounts via here)
    ├── routes/
    ├── models/             # Mongoose models
    └── .env
```

### 1. Backend (Express) setup

```js
// server/index.js
const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const via = require('@ironshieldph/via');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// --- body parsers first so req.body is available to loggers/tokens ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- CORS for the Vue dev server / deployed client ---
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// --- request id correlation (Vue client sends X-Request-Id) ---
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// --- logging ---
const logStream = process.stdout; // in prod: a file/rotating stream (see below)
app.use(via(isProd ? 'combined' : 'dev', {
  stream: logStream,
  colors: !isProd,
  skip: (req, res) => {
    // keep logs focused on API traffic
    if (req.path === '/api/health') return true;
    if (req.path.startsWith('/static')) return true;
    // drop CORS preflight noise
    if (req.method === 'OPTIONS') return true;
    return false;
  },
}));

// --- auth middleware sets req.user (JWT etc.) ---
// app.use(authMiddleware);

// --- routes ---
app.use('/api', require('./routes'));

// --- centralized error handler (logged too, because finish still fires) ---
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal error' });
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(process.env.PORT || 4000, () =>
    console.log(`API ready on :${process.env.PORT || 4000}`));
});
```

`via`'s `remoteUser` token automatically reads `req.user` (string, or
`req.user.name / username / id`), so once your auth middleware populates `req.user`,
usernames appear in `combined`/`common` formats with no extra work.

### 2. Frontend (Vue + Vite) proxy & request id

During development, let Vite proxy `/api` to Express so the browser sees a single origin:

```js
// client/vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
```

Correlate frontend and backend logs with a request id:

```js
// client/src/services/api.js
import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  config.headers['X-Request-Id'] = crypto.randomUUID();
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // the same id is echoed back by Express as X-Request-Id
    console.error('request failed', err.config?.headers?.['X-Request-Id'], err.response?.status);
    return Promise.reject(err);
  }
);
```

Register a matching token on the server so the id is printed:

```js
const via = require('@ironshieldph/via');
via.token('reqid', (req) => req.headers['x-request-id'] || req.id || '-');
app.use(via(':method :url :status :response-time ms :reqid', { colors: true }));
```

### 3. Logging request/response bodies (optional)

`via` logs metadata by default (status, timing, content length, headers). To capture
full bodies for debugging, capture them in a small middleware and expose them through
custom tokens. Keep this **dev-only** — bodies may contain secrets.

```js
// dev-only body capture
if (!isProd) {
  app.use((req, res, next) => {
    const reqChunks = [];
    const origReqOn = req.on.bind(req);
    // capture request body
    req.on('data', (c) => reqChunks.push(Buffer.from(c)));
    req.on('end', () => { req._body = Buffer.concat(reqChunks).toString('utf8'); });

    const resChunks = [];
    const origWrite = res.write.bind(res);
    const origEnd = res.end.bind(res);
    res.write = (...args) => {
      if (args[0]) resChunks.push(Buffer.from(args[0]));
      return origWrite(...args);
    };
    res.end = (...args) => {
      if (args[0]) resChunks.push(Buffer.from(args[0]));
      res.locals = res.locals || {};
      res.locals.responseBody = Buffer.concat(resChunks).toString('utf8');
      return origEnd(...args);
    };
    next();
  });
}

via.token('req-body', (req) => {
  const b = req._body || '';
  return b.length > 200 ? b.slice(0, 200) + '…' : b || '-';
});
via.token('res-body', (req, res) => {
  const b = (res.locals && res.locals.responseBody) || '';
  return b.length > 200 ? b.slice(0, 200) + '…' : b || '-';
});

app.use(via(':method :url :status :response-time ms | req=:req-body | res=:res-body', {
  colors: !isProd,
}));
```

### 4. Structured JSON for production / aggregators

```js
const fs = require('fs');
const stream = fs.createWriteStream('/var/log/mevn/access.log', { flags: 'a' });

app.use(via('json', {
  stream,
  skip: (req) => req.path === '/api/health' || req.method === 'OPTIONS',
}));
```

Each line is a JSON object:

```json
{"timestamp":"2026-11-10T12:00:00.000Z","method":"GET","url":"/api/users","status":200,"responseTime":12.345,"contentLength":"42","remoteAddr":"::1","remoteUser":"alice","httpVersion":"1.1","referrer":"-","userAgent":"axios/1.7.0"}
```

Pipe stdout to your platform's log collector (PM2, Docker, systemd, Loki, ELK, etc.)
instead of a file when running in containers.

### 5. Rotating files (optional)

`via` accepts any writable stream. For size/time-based rotation use a package such as
`rotating-file-stream`:

```js
const rfs = require('rotating-file-stream');
const stream = rfs.createStream('access.log', {
  interval: '1d',
  path: '/var/log/mevn',
  compress: 'gzip',
});
app.use(via('combined', { stream }));
```

## Formats

Built-in predefined formats:

| Name | Template |
| --- | --- |
| `dev` (default) | `:method :url :status :response-time ms - :res[content-length]` |
| `combined` | Apache combined log format |
| `common` | Apache common log format |
| `short` | compact |
| `tiny` | minimal |
| `json` | one JSON object per line |

```js
app.use(via('combined'));
app.use(via('json'));
```

Custom format string:

```js
app.use(via(':method :url :status :response-time ms'));
```

Custom format function (may return a string or an object, which is JSON-serialized):

```js
app.use(via({
  format: (token, req, res) => `${token('method')} ${token('status')} ${token('url')}`,
  stream: process.stdout,
  colors: false,
}));
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | `string \| function` | `'dev'` | Predefined name, format string, or function. |
| `stream` | `WritableStream` | `process.stdout` | Destination stream. |
| `skip` | `(req, res) => boolean` | — | Skip logging when returns truthy. |
| `colors` | `boolean` | TTY detection | Enable colorized output. |
| `immediate` | `boolean` | `false` | Log when request is received instead of on response finish. |
| `eol` | `string` | `'\n'` | Line ending. |
| `exercise` | `object` | disabled | Optional transaction observer; requires `enabled: true` and `VIA_EXERCISE_ENABLED=true`. Records method, query-free path, status, duration, and response completion to its configured stream (default: process.stdout). Does not record headers or bodies. |

`via(options, extra)` is also supported, e.g. `via('dev', { stream })`.

## Tokens

Built-in tokens (morgan-compatible):

`:method`, `:url`, `:status`, `:response-time`, `:total-time`, `:remote-addr`,
`:remote-user`, `:http-version`, `:referrer`, `:user-agent`, `:date`, `:req[header]`,
`:res[header]`.

- `:date` accepts a format in brackets: `:date[clf]`, `:date[iso]` (default),
  `:date[web]`.
- `:response-time` / `:total-time` are milliseconds with 3 decimals.
- `:url` prefers `req.originalUrl` (so mounted routers keep the full path).

Status codes are colorized by class (2xx green, 3xx cyan, 4xx yellow, 5xx red);
methods and URLs are colorized in dev mode.

## Custom tokens

```js
const via = require('@ironshieldph/via');

via.token('reqid', (req, res) => req.headers['x-request-id'] || '-');

app.use(via(':method :url :reqid'));
```

`via.token(name, fn)` returns `via` for chaining.

## Custom formats

```js
via.format('myformat', ':method :url :status');
app.use(via('myformat'));
```

## Skip logging

```js
app.use(via({
  skip: (req, res) => req.path === '/api/health',
}));
```

Common MEVN skips: `/api/health`, `/api/ready`, static asset paths, `OPTIONS` preflight,
and successful `204`/`304` if you want quieter logs.

## JSON / structured logging

```js
app.use(via('json'));
// {"timestamp":"...","method":"GET","url":"/","status":200,...}
```

## File / stream output

```js
const fs = require('fs');
const stream = fs.createWriteStream('/var/log/access.log', { flags: 'a' });
app.use(via({ format: 'combined', stream }));
```

## Security & privacy

- Never log `Authorization`, `Cookie`, or `Set-Cookie` headers. The built-in formats do
  not include them; if you write custom formats/tokens, redact them.
- Avoid logging request/response bodies in production (may contain passwords, tokens,
  PII). Gate body capture behind `NODE_ENV !== 'production'`.
- In production prefer `combined` or `json` without colors (`colors: false`) for
  machine-parseable output.
- `skip` health checks and probes to reduce noise and avoid leaking internal details.

## ESM

```js
import via from '@ironshieldph/via';
// or named exports
import { token, format, FORMATS, TOKENS, colors } from '@ironshieldph/via';

app.use(via('dev'));
```

## TypeScript

```ts
import via, { ViaOptions } from '@ironshieldph/via';

const opts: ViaOptions = { format: 'json', colors: false };
app.use(via(opts));
```

## API reference

- `via(options?, extra?)` → Express middleware
- `via.token(name, fn)` → `via`
- `via.format(name, fmt)` → `via`
- `via.FORMATS` — registered format templates
- `via.TOKENS` — registered token functions
- `via.colors` — ANSI color codes

## Troubleshooting

- **No output at all** — make sure `app.use(via(...))` is mounted **before** your
  routes, and that the stream's `write` is writable. In tests, pass a fake stream
  `{ write: (s) => {...}, isTTY: false }`.
- **Status shows `undefined` / response time missing** — you are using
  `immediate: true`. Switch to the default mode (log on `finish`) for final status.
- **Vue requests not showing** — confirm Vite's proxy target points at Express and that
  the browser actually calls `/api/...`. Via only sees traffic that reaches Express.
- **CORS preflight spam** — skip `req.method === 'OPTIONS'`.
- **`req.body` is `undefined` in a token** — mount `express.json()` (and urlencoded)
  before the routes; body parsers run during the request chain and `req.body` is set by
  the time the `finish` event fires.
- **Colors in log files** — set `colors: false` (or rely on non-TTY auto-detection).
- **Double logging** — ensure `via` is mounted once; check you are not also using
  `morgan`.

## License

MIT

## Owner-controlled cyber exercise notice example

The repository includes `examples/exercise-notice.js`, a standalone Express example for an authorized cyber exercise.

The example registers only the `/exercise-notice` route when `EXERCISE_NOTICE_ENABLED=true`. It does not intercept or rewrite existing application responses.

To integrate it, the application owner must import and mount the example in the consuming Express application. The example is not automatically included in the published npm package.

The notice identifies itself as a simulated exercise and explicitly states that it is not an actual seizure.

Use only in a designated, owner-approved exercise environment. The application owner is responsible for approval, deployment, and rollback.
