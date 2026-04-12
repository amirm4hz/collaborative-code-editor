const pool = require('../db/pool');

// Stores active room state in memory for fast access
// Structure: { roomId: { users: { socketId: { id, name, color, cursor } }, code, language } }
const activeRooms = {};

// Generates a random colour for each user's cursor
function generateUserColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Broadcasts the current user list to everyone in the room
function broadcastUserList(io, roomId) {
  if (!activeRooms[roomId]) return;
  const users = Object.values(activeRooms[roomId].users);
  io.to(roomId).emit('room:users', users);
}

function registerRoomHandlers(io, socket) {

  // --- Event: user joins a room ---
  // Fired when someone opens a room URL
  socket.on('room:join', async ({ roomId, userName }) => {
    try {
      // 1. Look up the room in the database
      const result = await pool.query(
        'SELECT * FROM rooms WHERE id = $1',
        [roomId]
      );

      if (result.rows.length === 0) {
        // Tell just this socket the room doesn't exist
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      const room = result.rows[0];

      // 2. Join the Socket.io room (this is what scopes broadcasts)
      socket.join(roomId);

      // 3. Initialise the room in memory if it's the first user
      if (!activeRooms[roomId]) {
        activeRooms[roomId] = {
          users: {},
          code: room.code || '',
          language: room.language || 'javascript',
        };
      }

      // 4. Register this user in the room
      const user = {
        id: socket.id,
        name: userName || 'Anonymous',
        color: generateUserColor(),
        cursor: null, // will be updated as they type
      };
      activeRooms[roomId].users[socket.id] = user;

      // 5. Send the joining user the current room state
      // (so they see the existing code immediately)
      socket.emit('room:joined', {
        room: {
          id: room.id,
          name: room.name,
          language: activeRooms[roomId].language,
          code: activeRooms[roomId].code,
        },
        user,
      });

      // 6. Tell everyone else in the room a new user joined
      socket.to(roomId).emit('room:user_joined', user);

      // 7. Broadcast updated user list to everyone in room
      broadcastUserList(io, roomId);

      console.log(`✅ ${user.name} joined room ${roomId}`);
    } catch (err) {
      console.error('room:join error:', err.message);
      socket.emit('room:error', { message: 'Failed to join room' });
    }
  });

  // --- Event: user changes the code ---
  // Fired on every keystroke from any user
  socket.on('code:change', ({ roomId, code }) => {
    if (!activeRooms[roomId]) return;

    // Update the in-memory code snapshot
    activeRooms[roomId].code = code;

    // Broadcast to everyone EXCEPT the sender
    // (the sender already has the change — sending it back causes a loop)
    socket.to(roomId).emit('code:update', { code });
  });

  // --- Event: user changes the language ---
  socket.on('language:change', ({ roomId, language }) => {
    if (!activeRooms[roomId]) return;

    activeRooms[roomId].language = language;

    // Broadcast to everyone INCLUDING the sender
    // so all editors switch language simultaneously
    io.to(roomId).emit('language:update', { language });
  });

  // --- Event: user moves their cursor ---
  // Fired frequently — we'll use this in Stage 7 for coloured cursors
  socket.on('cursor:move', ({ roomId, cursor }) => {
    if (!activeRooms[roomId]) return;
    if (!activeRooms[roomId].users[socket.id]) return;

    // Update this user's cursor position in memory
    activeRooms[roomId].users[socket.id].cursor = cursor;

    // Tell everyone else where this cursor is
    socket.to(roomId).emit('cursor:update', {
      userId: socket.id,
      cursor,
      color: activeRooms[roomId].users[socket.id].color,
      name: activeRooms[roomId].users[socket.id].name,
    });
  });

  // --- Event: user disconnects ---
  // Socket.io fires this automatically when a user closes the tab
  socket.on('disconnect', async () => {
    // Find which room this socket was in
    for (const roomId in activeRooms) {
      const user = activeRooms[roomId].users[socket.id];
      if (!user) continue;

      // Remove user from the room
      delete activeRooms[roomId].users[socket.id];

      // Tell everyone else this user left
      io.to(roomId).emit('room:user_left', { userId: socket.id });

      // Broadcast updated user list
      broadcastUserList(io, roomId);

      // If room is now empty, persist the final code to the database
      // and clean up memory
      const remainingUsers = Object.keys(activeRooms[roomId].users).length;
      if (remainingUsers === 0) {
        try {
          await pool.query(
            'UPDATE rooms SET code = $1, language = $2, updated_at = NOW() WHERE id = $3',
            [activeRooms[roomId].code, activeRooms[roomId].language, roomId]
          );
          console.log(`💾 Room ${roomId} saved to DB and cleared from memory`);
        } catch (err) {
          console.error('Failed to persist room on empty:', err.message);
        }
        delete activeRooms[roomId];
      }

      console.log(`👋 ${user.name} left room ${roomId}`);
      break;
    }
  });
}

module.exports = { registerRoomHandlers, activeRooms };