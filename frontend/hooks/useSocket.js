import { useEffect, useState, useCallback, useRef } from 'react';
import socket from '../lib/socket';
import { useOT } from './useOT';

export function useSocket({ roomId, userName }) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [error, setError] = useState('');
  // Stores cursor positions for all remote users
  // Structure: { userId: { position, color, name } }
  const [cursors, setCursors] = useState({});

  const codeRef = useRef('');
  codeRef.current = code;

  const { submitOperation, receiveOperation, acknowledgeOperation } = useOT({
    roomId,
    socket,
  });

  useEffect(() => {
    if (!roomId || !userName) return;

    socket.connect();

    function onConnect() {
      setIsConnected(true);
      socket.emit('room:join', { roomId, userName });
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onRoomJoined({ room, user }) {
      setRoomData(room);
      setCurrentUser(user);
      setCode(room.code || '');
      codeRef.current = room.code || '';
      setLanguage(room.language || 'javascript');
    }

    function onUserJoined(user) {
      setUsers(prev => {
        if (prev.find(u => u.id === user.id)) return prev;
        return [...prev, user];
      });
    }

    function onRoomUsers(userList) {
      setUsers(userList);
    }

    function onUserLeft({ userId }) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      // Remove their cursor when they leave
      setCursors(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }

    function onCodeUpdate({ code: newCode }) {
      setCode(newCode);
      codeRef.current = newCode;
    }

    function onLanguageUpdate({ language: newLang }) {
      setLanguage(newLang);
    }

    function onRoomError({ message }) {
      setError(message);
    }

    function onOTOperation(op) {
      const newCode = receiveOperation(op, codeRef.current);
      setCode(newCode);
      codeRef.current = newCode;
    }

    function onOTAck() {
      acknowledgeOperation();
    }

    // Receive another user's cursor position
    function onCursorUpdate({ userId, cursor, color, name }) {
      setCursors(prev => ({
        ...prev,
        [userId]: { position: cursor, color, name },
      }));
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('room:joined', onRoomJoined);
    socket.on('room:user_joined', onUserJoined);
    socket.on('room:users', onRoomUsers);
    socket.on('room:user_left', onUserLeft);
    socket.on('code:update', onCodeUpdate);
    socket.on('language:update', onLanguageUpdate);
    socket.on('room:error', onRoomError);
    socket.on('ot:operation', onOTOperation);
    socket.on('ot:ack', onOTAck);
    socket.on('cursor:update', onCursorUpdate);

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
      socket.off('ot:operation', onOTOperation);
      socket.off('ot:ack', onOTAck);
      socket.off('cursor:update', onCursorUpdate);
      socket.disconnect();
    };
  }, [roomId, userName]);

  const emitCodeChange = useCallback((newCode) => {
    submitOperation(codeRef.current, newCode);
    setCode(newCode);
    codeRef.current = newCode;
  }, [submitOperation]);

  const emitLanguageChange = useCallback((newLanguage) => {
    socket.emit('language:change', { roomId, language: newLanguage });
  }, [roomId]);

  // Emit our cursor position to the server whenever it moves
  const emitCursorMove = useCallback((cursor) => {
    socket.emit('cursor:move', { roomId, cursor });
  }, [roomId]);

  return {
    isConnected,
    roomData,
    currentUser,
    users,
    code,
    language,
    error,
    cursors,
    emitCodeChange,
    emitLanguageChange,
    emitCursorMove,
  };
}