import { io } from 'socket.io-client';

// Create the socket connection once and reuse it everywhere
// This prevents multiple connections being opened accidentally
const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
  // Don't connect immediately — wait until we explicitly call socket.connect()
  autoConnect: false,
  // Automatically try to reconnect if the connection drops
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;