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
  const [cursors, setCursors] = useState({});
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

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
      setMessages(prev => [...prev, {
        id: `sys-${Date.now()}`,
        system: true,
        text: `${user.name} joined the room`,
        timestamp: new Date().toISOString(),
      }]);
    }

    function onRoomUsers(userList) {
      setUsers(userList);
    }

    function onUserLeft({ userId }) {
      setUsers(prev => {
        const user = prev.find(u => u.id === userId);
        if (user) {
          setMessages(msgs => [...msgs, {
            id: `sys-${Date.now()}`,
            system: true,
            text: `${user.name} left the room`,
            timestamp: new Date().toISOString(),
          }]);
        }
        return prev.filter(u => u.id !== userId);
      });
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

    function onCursorUpdate({ userId, cursor, color, name }) {
      setCursors(prev => ({
        ...prev,
        [userId]: { position: cursor, color, name },
      }));
    }

    function onChatReceive(message) {
      setMessages(prev => [...prev, message]);
    }

    // File sync events
    function onFileSwitched({ fileId }) {
      setActiveFileId(fileId);
    }

    function onFileAdded({ file }) {
      setFiles(prev => [...prev, file]);
    }

    function onFileRemoved({ fileId, newActiveFileId }) {
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setActiveFileId(newActiveFileId);
    }

    function onFileNameUpdated({ fileId, name }) {
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name } : f));
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
    socket.on('chat:receive', onChatReceive);
    socket.on('file:switched', onFileSwitched);
    socket.on('file:added', onFileAdded);
    socket.on('file:removed', onFileRemoved);
    socket.on('file:name_updated', onFileNameUpdated);

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
      socket.off('chat:receive', onChatReceive);
      socket.off('file:switched', onFileSwitched);
      socket.off('file:added', onFileAdded);
      socket.off('file:removed', onFileRemoved);
      socket.off('file:name_updated', onFileNameUpdated);
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

  const emitCursorMove = useCallback((cursor) => {
    socket.emit('cursor:move', { roomId, cursor });
  }, [roomId]);

  const emitChatMessage = useCallback((text) => {
    socket.emit('chat:message', { roomId, text });
  }, [roomId]);

  const emitFileSwitch = useCallback((fileId) => {
    socket.emit('file:switch', { roomId, fileId });
    setActiveFileId(fileId);
  }, [roomId]);

  const emitFileCreated = useCallback((file) => {
    socket.emit('file:created', { roomId, file });
  }, [roomId]);

  const emitFileDeleted = useCallback((fileId, newActiveFileId) => {
    socket.emit('file:deleted', { roomId, fileId, newActiveFileId });
  }, [roomId]);

  const emitFileRenamed = useCallback((fileId, name) => {
    socket.emit('file:renamed', { roomId, fileId, name });
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
    messages,
    files,
    activeFileId,
    emitCodeChange,
    emitLanguageChange,
    emitCursorMove,
    emitChatMessage,
    emitFileSwitch,
    emitFileCreated,
    emitFileDeleted,
    emitFileRenamed,
    setFiles,
    setActiveFileId,
    setCode,
    setLanguage,
  };
}