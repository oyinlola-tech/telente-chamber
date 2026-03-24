const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { pool, initDatabase } = require('./db');
const { authenticateToken } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimiter');
const { upload } = require('./middleware/upload');
const email = require('./utils/email');
const { createPagesRouter } = require('./routes/pages');
const { createApiRouter } = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false, 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(cookieParser());

// Serve branded favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'uploads', 'img', 'legal-specturm.svg'));
});

app.use(
  '/',
  createPagesRouter({
    baseDir: __dirname,
    authenticateToken
  })
);

app.use(
  '/api',
  apiLimiter,
  createApiRouter({
    pool,
    upload,
    authenticateToken,
    email,
    baseDir: __dirname
  })
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
