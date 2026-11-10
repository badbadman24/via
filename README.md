# @ironshieldph/via

Flexible, modern request/response logging middleware for Express.

A drop-in replacement for `morgan` with a familiar token API plus structured JSON output, colorized dev mode, custom tokens, streams, and skip rules.

## Install

```bash
npm install @ironshieldph/via
```

Peer dependency: `express >= 4`.

## Quick start

```js
const express = require('express');
const via = require('@ironshieldph/via');

const app = express();

// Default "dev" format, colorized when stdout is a TTY
app.use(via());

app.get('/', (req, res) => res.send('hello'));
app.listen(3000);
```

## Formats

Built-in predefined formats:

- `dev` (default) — `:method :url :status :response-time ms - :res[content-length]`
- `combined` — Apache combined log format
- `common` — Apache common log format
- `short`
- `tiny`
- `json` — one JSON object per line

```js
app.use(via('combined'));
app.use(via('json'));
```

Custom format string:

```js
app.use(via(':method :url :status :response-time ms'));
```

Custom format function:

```js
app.use(via({
  format: (token, req, res) => `${token('method')} ${token('status')} ${token('url')}`,
  stream: process.stdout,
  colors: false,
}));
```

A format function may return a string or an object (serialized as JSON).

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | string \| function | `'dev'` | Predefined name, format string, or function. |
| `stream` | WritableStream | `process.stdout` | Destination stream. |
| `skip` | `(req, res) => boolean` | — | Skip logging when returns truthy. |
| `colors` | boolean | TTY detection | Enable colorized output. |
| `immediate` | boolean | `false` | Log when request is received instead of on response finish. |
| `eol` | string | `'\n'` | Line ending. |

## Tokens

Built-in tokens (morgan-compatible):

`:method`, `:url`, `:status`, `:response-time`, `:total-time`, `:remote-addr`, `:remote-user`, `:http-version`, `:referrer`, `:user-agent`, `:date`, `:req[header]`, `:res[header]`.

`:date` accepts a format in brackets: `:date[clf]`, `:date[iso]` (default), `:date[web]`.

## Custom tokens

```js
const via = require('@ironshieldph/via');

via.token('reqid', (req, res) => req.headers['x-request-id'] || '-');

app.use(via(':method :url :reqid'));
```

## Custom formats

```js
via.format('myformat', ':method :url :status');
app.use(via('myformat'));
```

## Skip logging

```js
app.use(via({
  skip: (req, res) => req.path === '/healthz',
}));
```

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

## ESM

```js
import via from '@ironshieldph/via';
```

## License

MIT
