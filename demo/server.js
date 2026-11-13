'use strict';

// Demo server: serves demo/public/index.html and logs every request with via.
// Run from the project root:  npm run demo   (or: node demo/server.js)

const path = require('path');
const express = require('express');
const via = require('../src');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(via('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`ANON//LEARNING_NODE demo running at http://localhost:${PORT}`);
});
