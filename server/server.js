const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// ── Security Middleware ─────────────────────────────────────────
app.use(helmet());           // sets 11 secure HTTP headers automatically
app.use(mongoSanitize());    // strips $, . from req.body, req.params, req.query
app.use(xss());              // strips <script> tags and HTML from inputs

// Rate limiting — max 100 requests per IP per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// ── General Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));

// ── Test route ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('Blog API is running...');
});

// ── Global Error Handler ────────────────────────────────────────
// This is a real world pattern — a centralized error handler
// Any route can call next(err) and it lands here
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// ── Connect DB & Start Server ───────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT, () => {
      console.log(`✅ Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.error('❌ Connection failed:', err.message));