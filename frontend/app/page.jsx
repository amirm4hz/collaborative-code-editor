'use client'; // This tells Next.js this component runs in the browser, not on the server

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  // State for the "Create Room" form
  const [roomName, setRoomName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // State for the "Join Room" form
  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Theme state
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setIsDark(saved === 'dark');
    setMounted(true);
  }, []);

  function toggleTheme() {
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
    setIsDark(!isDark);
  }

  // Creates a new room via our backend API, then redirects to it
  async function handleCreate(e) {
    e.preventDefault(); // Prevent browser default form submission
    if (!roomName.trim()) {
      setCreateError('Please enter a room name');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: roomName.trim(), language }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create room');
      }

      const room = await res.json();
      // Redirect to the room page — Next.js handles this client-side
      router.push(`/room/${room.id}`);
    } catch (err) {
      setCreateError(err.message);
      setCreating(false);
    }
  }

  // Validates the room exists then navigates to it
  async function handleJoin(e) {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) {
      setJoinError('Please enter a room ID or paste a link');
      return;
    }

    // Extract just the ID if someone pastes a full URL
    const roomId = id.includes('/') ? id.split('/').pop() : id;

    setJoining(true);
    setJoinError('');

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}`
      );

      if (!res.ok) {
        throw new Error('Room not found. Check the ID and try again.');
      }

      router.push(`/room/${roomId}`);
    } catch (err) {
      setJoinError(err.message);
      setJoining(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* Top navigation bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            CollabCode
          </span>
        </div>

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          aria-label="Toggle theme"
        >
          {mounted ? (isDark ? '☀️' : '🌙') : '☀️'}
        </button>
      </nav>

      {/* Hero section */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-16">
        <div className="text-center mb-12 max-w-2xl">
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Code together,{' '}
            <span className="text-indigo-500">in real time</span>
          </h1>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Collaborative code editing with live cursors, syntax highlighting,
            and instant code execution. No account needed.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">

          {/* Create Room Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Create a room
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Start a new session and invite teammates
            </p>

            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                className="input-field"
                type="text"
                placeholder="Room name (e.g. Interview Prep)"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                maxLength={100}
              />

              <select
                className="input-field"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="c">C</option>
              </select>

              {createError && (
                <p className="text-red-400 text-sm">{createError}</p>
              )}

              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Creating...' : '+ Create Room'}
              </button>
            </form>
          </div>

          {/* Join Room Card */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              Join a room
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Paste a room link or enter an ID
            </p>

            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                className="input-field"
                type="text"
                placeholder="Room ID or full link"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
              />

              {joinError && (
                <p className="text-red-400 text-sm">{joinError}</p>
              )}

              <button type="submit" className="btn-secondary" disabled={joining}>
                {joining ? 'Joining...' : '→ Join Room'}
              </button>
            </form>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-10 justify-center">
          {['⚡ Real-time sync', '👥 Live cursors', '▶️ Run code', '🌙 Dark mode', '🔗 Shareable links'].map((f) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full text-sm"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}