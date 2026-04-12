// Operational Transform — server side
// The server is the source of truth for operation ordering.
// When two clients send operations concurrently, the server
// transforms them into a consistent order and broadcasts
// the transformed versions to all clients.

// Stores operation history per room for transformation
// Structure: { roomId: [{ type, position, value, revision, socketId }] }
const roomOperations = {};

function transformOp(opA, opB) {
  if (opA.type === 'insert' && opB.type === 'insert') {
    if (opB.position <= opA.position) {
      return { ...opA, position: opA.position + opB.value.length };
    }
    return opA;
  }

  if (opA.type === 'insert' && opB.type === 'delete') {
    if (opB.position < opA.position) {
      return {
        ...opA,
        position: Math.max(opA.position - opB.value.length, opB.position),
      };
    }
    return opA;
  }

  if (opA.type === 'delete' && opB.type === 'insert') {
    if (opB.position <= opA.position) {
      return { ...opA, position: opA.position + opB.value.length };
    }
    return opA;
  }

  if (opA.type === 'delete' && opB.type === 'delete') {
    if (opB.position < opA.position) {
      return {
        ...opA,
        position: Math.max(opA.position - opB.value.length, opB.position),
      };
    }
    return opA;
  }

  return opA;
}

function applyOp(code, op) {
  if (op.type === 'insert') {
    return code.slice(0, op.position) + op.value + code.slice(op.position);
  }
  if (op.type === 'delete') {
    return (
      code.slice(0, op.position) + code.slice(op.position + op.value.length)
    );
  }
  return code;
}

function registerOTHandlers(io, socket, activeRooms) {
  socket.on('ot:operation', (op) => {
    const { roomId } = op;
    if (!activeRooms[roomId]) return;

    // Initialise operation history for this room if needed
    if (!roomOperations[roomId]) {
      roomOperations[roomId] = [];
    }

    const history = roomOperations[roomId];

    // Get all operations that happened after the client's revision
    // These are the ops the client didn't know about when they made their change
    const concurrentOps = history.slice(op.revision);

    // Transform the incoming op against all concurrent ops
    let transformedOp = op;
    for (const concurrentOp of concurrentOps) {
      transformedOp = transformOp(transformedOp, concurrentOp);
    }

    // Apply the transformed op to the authoritative code in memory
    activeRooms[roomId].code = applyOp(activeRooms[roomId].code, transformedOp);

    // Add to history
    history.push(transformedOp);

    // Keep history from growing forever — trim to last 1000 ops
    if (history.length > 1000) {
      roomOperations[roomId] = history.slice(-500);
    }

    // Acknowledge to the sender that their op was received and applied
    socket.emit('ot:ack');

    // Broadcast the TRANSFORMED op to everyone else in the room
    // They need the transformed version so their positions are correct
    socket.to(roomId).emit('ot:operation', {
      ...transformedOp,
      socketId: socket.id,
    });
  });

  // Clean up room operation history when room empties
  socket.on('disconnect', () => {
    // We don't clean up immediately — the roomHandler handles room cleanup
    // Just note that this socket is gone
  });
}

// Export cleanup function so roomHandler can call it when room empties
function cleanupRoomOT(roomId) {
  delete roomOperations[roomId];
}

module.exports = { registerOTHandlers, cleanupRoomOT };