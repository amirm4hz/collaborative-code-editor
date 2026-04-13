require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { generalLimiter } = require('./middleware/rateLimiter');
const { registerRoomHandlers } = require('./socket/roomHandler');
const { registerOTHandlers } = require('./socket/otHandler');

const roomsRouter = require('./routes/rooms');
const executeRouter = require('./routes/execute');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json());
app.use(generalLimiter);

app.use('/api/rooms', roomsRouter);
app.use('/api/execute', executeRouter);

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

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Register room handlers (join, leave, cursor, code broadcast)
  registerRoomHandlers(io, socket);

  // Register OT handlers (conflict-free operation transforms)
  // We pass activeRooms from roomHandler via a shared reference
  const { activeRooms } = require('./socket/roomHandler');
  registerOTHandlers(io, socket, activeRooms);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Accepting connections from ${process.env.CLIENT_URL}`);
});

module.exports = server;