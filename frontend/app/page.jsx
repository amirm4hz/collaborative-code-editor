'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '../hooks/useProfile';
import ProfileSetup from '../components/ProfileSetup';
import RecentRooms from '../components/RecentRooms';

export default function HomePage() {
  const router = useRouter();
  const { profile, recentRooms, loaded, saveProfile, removeRecentRoom } = useProfile();

  const [roomName, setRoomName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

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

  async function handleCreate(e) {
    e.preventDefault();
    if (!roomName.trim()) {
      setCreateError('Please enter a room name');
      return;
    }

    setCreating(true);
    setCreateError('');

    const maxRetries = 3;
    const delays = [0, 8000, 15000];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setCreateError(`Server is waking up... retrying (${attempt}/${maxRetries - 1})`);
          await new Promise(res => setTimeout(res, delays[attempt]));
        }

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
        router.push(`/room/${room.id}`);
        return;
      } catch (err) {
        if (attempt === maxRetries - 1) {
          setCreateError('Server unavailable. Please try again in a moment.');
          setCreating(false);
        }
      }
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    const id = joinId.trim();
    if (!id) {
      setJoinError('Please enter a room ID or paste a link');
      return;
    }

    const roomId = id.includes('/') ? id.split('/').pop() : id;
    setJoining(true);
    setJoinError('');

    const maxRetries = 3;
    const delays = [0, 8000, 15000];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          setJoinError(`Server is waking up... retrying (${attempt}/${maxRetries - 1})`);
          await new Promise(res => setTimeout(res, delays[attempt]));
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}`
        );

        if (!res.ok) throw new Error('Room not found. Check the ID and try again.');
        router.push(`/room/${roomId}`);
        return;
      } catch (err) {
        if (attempt === maxRetries - 1) {
          setJoinError(err.message);
          setJoining(false);
        }
      }
    }
  }

  // Don't render until localStorage is loaded — prevents hydration mismatch
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // First time user — show profile setup
  if (!profile && !showProfileEdit) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
            C
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome to CollabCode
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            First, let's set up your profile
          </p>
        </div>
        <ProfileSetup onSave={saveProfile} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            C
          </div>
          <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
            CollabCode
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Profile pill */}
          {profile && (
            <button
              onClick={() => setShowProfileEdit(!showProfileEdit)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors hover:bg-[var(--bg-surface)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: profile.color }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {profile.name}
              </span>
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            aria-label="Toggle theme"
          >
            {mounted ? (isDark ? '☀️' : '🌙') : '☀️'}
          </button>
        </div>
      </nav>

      {/* Profile edit panel */}
      {showProfileEdit && (
        <div
          className="border-b px-6 py-4 flex justify-center"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
        >
          <ProfileSetup
            onSave={(name, color) => {
              saveProfile(name, color);
              setShowProfileEdit(false);
            }}
            initialName={profile?.name || ''}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 px-4 py-12">
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Code together,{' '}
            <span className="text-indigo-500">in real time</span>
          </h1>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Collaborative code editing with live cursors, syntax highlighting,
            and instant code execution. No account needed.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Create Room */}
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
                <option value="typescript">TypeScript</option>
              </select>
              {createError && <p className="text-red-400 text-sm">{createError}</p>}
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? 'Creating...' : '+ Create Room'}
              </button>
            </form>
          </div>

          {/* Join Room */}
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
              {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
              <button type="submit" className="btn-secondary" disabled={joining}>
                {joining ? 'Joining...' : '→ Join Room'}
              </button>
            </form>
          </div>
        </div>

        {/* Recent rooms */}
        <RecentRooms
          rooms={recentRooms}
          onRemove={removeRecentRoom}
        />

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-10 justify-center">
          {['⚡ Real-time sync', '👥 Live cursors', '▶️ Run code', '🌙 Dark mode', '🔗 Shareable links', '💬 Group chat', '📁 Multiple files'].map((f) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full text-sm"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}