'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../hooks/useSocket';
import Editor from '../../../components/Editor';
import Toolbar from '../../../components/Toolbar';
import UserList from '../../../components/UserList';

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();

  // Room loading state
  const [roomMeta, setRoomMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // User identity
  const [userName, setUserName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);

  // Theme
  const [isDark, setIsDark] = useState(true);

  // Fetch room metadata on load
  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}`
        );
        if (!res.ok) throw new Error('Room not found');
        const data = await res.json();
        setRoomMeta(data);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();

    // Read saved theme preference
    const saved = localStorage.getItem('theme') || 'dark';
    setIsDark(saved === 'dark');
  }, [roomId]);

  // Connect to socket only after the user has entered their name
  const {
    isConnected,
    currentUser,
    users,
    code,
    language,
    error: socketError,
    emitCodeChange,
    emitLanguageChange,
  } = useSocket(
    nameSubmitted
      ? { roomId, userName }
      : { roomId: null, userName: null }   // don't connect until name is set
  );

  function handleThemeToggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    alert('Room link copied to clipboard!');
  }

  // When the local user types, emit to server
  function handleCodeChange(newCode) {
    emitCodeChange(newCode);
  }

  // When language changes, emit to server (syncs for all users)
  function handleLanguageChange(newLanguage) {
    emitLanguageChange(newLanguage);
  }

  function handleNameSubmit(e) {
    e.preventDefault();
    if (!userName.trim()) return;
    setNameSubmitted(true);
  }

  // --- Render states ---

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading room...</p>
        </div>
      </div>
    );
  }

  if (fetchError || socketError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="card text-center max-w-md">
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {fetchError ? 'Room not found' : 'Connection error'}
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {fetchError || socketError}
          </p>
          <button className="btn-primary" onClick={() => router.push('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!nameSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="card max-w-sm w-full">
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Joining: <span className="text-indigo-400">{roomMeta?.name}</span>
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            What should we call you?
          </p>
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-3">
            <input
              className="input-field"
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={30}
              autoFocus
            />
            <button type="submit" className="btn-primary">
              Enter Room →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main editor view ---
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar
        roomName={roomMeta?.name}
        language={language}
        onLanguageChange={handleLanguageChange}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        isConnected={isConnected}
        onShare={handleShare}
      />

      <div className="flex flex-1 overflow-hidden">
        <Editor
          code={code}
          language={language}
          isDark={isDark}
          onChange={handleCodeChange}
        />
        <UserList
          users={users}
          currentUserId={currentUser?.id}
        />
      </div>
    </div>
  );
}