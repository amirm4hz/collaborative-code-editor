import { useEffect, useState, useCallback } from 'react';
import socket from '../lib/socket';

// Custom hook that manages the entire socket lifecycle for a room
// Returns everything the room page needs to know about the connection
export function useSocket({ roomId, userName }) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomData, setRoomData] = useState(null);   // room info from server
  const [currentUser, setCurrentUser] = useState(null); // our own user object
  const [users, setUsers] = useState([]);            // all users in room
  const [code, setCode] = useState('');              // latest code from server
  const [language, setLanguage] = useState('javascript');
  const [error, setError] = useState('');

  useEffect(() => {
    // Don't connect until we have both roomId and userName
    if (!roomId || !userName) return;
    
    // Connect the socket when this hook mounts
    socket.connect();

    // --- Connection events ---
    function onConnect() {
      setIsConnected(true);
      // Once connected, join the room
      socket.emit('room:join', { roomId, userName });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    // --- Room events ---

    // Server sends this only to us when we successfully join
    function onRoomJoined({ room, user }) {
      setRoomData(room);
      setCurrentUser(user);
      setCode(room.code || '');
      setLanguage(room.language || 'javascript');
    }

    // Server sends this to everyone else when a new user joins
    function onUserJoined(user) {
      setUsers(prev => {
        // Avoid duplicates
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
    }

    // Server sends the full updated user list
    function onRoomUsers(userList) {
      setUsers(userList);
    }

    // Server sends this when someone leaves
    function onUserLeft({ userId }) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }

    // Server sends this when another user changes the code
    function onCodeUpdate({ code: newCode }) {
      setCode(newCode);
    }

    // Server sends this when anyone changes the language
    function onLanguageUpdate({ language: newLang }) {
      setLanguage(newLang);
    }

    function onRoomError({ message }) {
      setError(message);
    }

    // Register all event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:joined', onRoomJoined);
    socket.on('room:user_joined', onUserJoined);
    socket.on('room:users', onRoomUsers);
    socket.on('room:user_left', onUserLeft);
    socket.on('code:update', onCodeUpdate);
    socket.on('language:update', onLanguageUpdate);
    socket.on('room:error', onRoomError);

    // Cleanup: remove listeners and disconnect when component unmounts
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room:joined', onRoomJoined);
      socket.off('room:user_joined', onUserJoined);
      socket.off('room:users', onRoomUsers);
      socket.off('room:user_left', onUserLeft);
      socket.off('code:update', onCodeUpdate);
      socket.off('language:update', onLanguageUpdate);
      socket.off('room:error', onRoomError);
      socket.disconnect();
    };
  }, [roomId, userName]);

  // Emit code changes to the server
  // useCallback memoizes this function so it doesn't get recreated on every render
  const emitCodeChange = useCallback((newCode) => {
    socket.emit('code:change', { roomId, code: newCode });
  }, [roomId]);

  // Emit language changes to the server
  const emitLanguageChange = useCallback((newLanguage) => {
    socket.emit('language:change', { roomId, language: newLanguage });
  }, [roomId]);

  return {
    isConnected,
    roomData,
    currentUser,
    users,
    code,
    language,
    error,
    emitCodeChange,
    emitLanguageChange,
  };
}