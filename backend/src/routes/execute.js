const express = require('express');
const router = express.Router();
const axios = require('axios');
const { executeLimiter } = require('../middleware/rateLimiter');

const LANGUAGE_MAP = {
  javascript: { language: 'nodejs', versionIndex: '4' },
  python: { language: 'python3', versionIndex: '3' },
  c: { language: 'c', versionIndex: '5' },
};

router.post('/', executeLimiter, async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }

  const lang = LANGUAGE_MAP[language];
  if (!lang) {
    return res.status(400).json({ error: `Unsupported language: ${language}` });
  }

  try {
    const response = await axios.post(
      'https://api.jdoodle.com/v1/execute',
      {
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: code,
        language: lang.language,
        versionIndex: lang.versionIndex,
      }
    );

    const result = response.data;
    const output = result.output || '';

    const hasError = output.includes('Error') ||
                     output.includes('error') ||
                     output.includes('warning') ||
                     output.includes('Timeout') ||
                     result.statusCode !== 200;

    res.json({
      stdout: hasError ? '' : output,
      stderr: hasError ? output : '',
      compileOutput: '',
      status: hasError ? 'Runtime Error' : 'Accepted',
      success: !hasError,
      time: result.cpuTime || null,
      memory: result.memory || null,
    });
  } catch (err) {
    console.error('Execution error:', err.response?.data || err.message);
    res.status(500).json({ error: err.message || 'Failed to execute code' });
  }
});

module.exports = router;