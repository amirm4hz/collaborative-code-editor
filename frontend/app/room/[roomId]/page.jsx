'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RoomPage() {
  const { roomId } = useParams(); // Reads the [roomId] from the URL
  const router = useRouter();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);

  // Fetch room details when the page loads
  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}`
        );

        if (!res.ok) {
          throw new Error('Room not found');
        }

        const data = await res.json();
        setRoom(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRoom();
  }, [roomId]); // Re-runs if roomId changes

  function handleNameSubmit(e) {
    e.preventDefault();
    if (!userName.trim()) return;
    setNameSubmitted(true);
  }

  // Copy the room URL to clipboard
  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    alert('Room link copied to clipboard!');
  }

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="card text-center max-w-md">
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Room not found
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button className="btn-primary" onClick={() => router.push('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Ask for the user's display name before entering the room
  if (!nameSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="card max-w-sm w-full">
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Joining: <span className="text-indigo-400">{room.name}</span>
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

  // Main room view — editor goes here in Stage 5
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>

      {/* Room toolbar */}
      <header
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            ← Home
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {room.name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
          >
            {room.language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            👤 {userName}
          </span>
          <button onClick={copyLink} className="btn-secondary text-sm py-1.5 px-3">
            🔗 Share
          </button>
        </div>
      </header>

      {/* Editor placeholder — replaced in Stage 5 */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">⌨️</p>
          <p className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Editor loads here in Stage 5
          </p>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Room ID: <code className="font-mono text-indigo-400">{roomId}</code>
          </p>
        </div>
      </div>
    </div>
  );
}