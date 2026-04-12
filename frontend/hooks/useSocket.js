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

  // Keep a ref to current code so our callbacks always have the latest value
  // without needing to re-register event listeners
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
    }

    // Legacy full-code broadcast (used for language changes and initial sync)
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

    // Receive an OT operation from another user
    function onOTOperation(op) {
      const newCode = receiveOperation(op, codeRef.current);
      setCode(newCode);
      codeRef.current = newCode;
    }

    // Server acknowledged our operation
    function onOTAck() {
      acknowledgeOperation();
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
      socket.disconnect();
    };
  }, [roomId, userName]);

  const emitCodeChange = useCallback((newCode) => {
    // Use OT to submit the operation instead of broadcasting raw code
    submitOperation(codeRef.current, newCode);
    // Update local state immediately (optimistic update)
    setCode(newCode);
    codeRef.current = newCode;
  }, [submitOperation]);

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