require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { generalLimiter } = require('./middleware/rateLimiter');

// Route imports
const roomsRouter = require('./routes/rooms');

const app = express();
const server = http.createServer(app); // We wrap Express in an HTTP server
                                        // so Socket.io can attach to it later

// --- Middleware ---

// CORS: allows our frontend (different origin) to talk to this backend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));

app.use(express.json()); // Parse incoming JSON request bodies
app.use(generalLimiter); // Apply rate limiting to all routes

// --- Routes ---
app.use('/api/rooms', roomsRouter);

// Health check endpoint — used by Railway to confirm the server is alive
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler for any undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start Server ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Accepting connections from ${process.env.CLIENT_URL}`);
});

module.exports = server; // exported for testing later