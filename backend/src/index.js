require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { generalLimiter } = require('./middleware/rateLimiter');
const { registerRoomHandlers } = require('./socket/roomHandler');

// Route imports
const roomsRouter = require('./routes/rooms');

const app = express();
const server = http.createServer(app);

// --- Attach Socket.io to the HTTP server ---
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  // How long to wait before giving up on a connection
  pingTimeout: 60000,
});

// --- Middleware ---
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json());
app.use(generalLimiter);

// --- REST Routes ---
app.use('/api/rooms', roomsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Socket.io Connection Handler ---
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Register all room-related socket events
  registerRoomHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Accepting connections from ${process.env.CLIENT_URL}`);
});

module.exports = server;