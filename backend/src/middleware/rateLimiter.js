const rateLimit = require('express-rate-limit');

// Protects our API from being spammed
// Limits each IP to 100 requests per 15 minutes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit specifically for code execution (Judge0 has API quotas)
const executeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Execution rate limit reached. Wait a moment and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, executeLimiter };