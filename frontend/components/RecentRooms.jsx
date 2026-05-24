'use client';

import { useRouter } from 'next/navigation';

const LANGUAGE_ICONS = {
  javascript: '🟨',
  typescript: '🔷',
  python: '🐍',
};

function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function RecentRooms({ rooms, onRemove }) {
  const router = useRouter();

  if (rooms.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mt-8">
      <h3
        className="text-sm font-semibold mb-3 uppercase tracking-wider"
        style={{ color: 'var(--text-secondary)' }}
      >
        Recent Rooms
      </h3>

      <div className="flex flex-col gap-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-colors group"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-secondary)',
            }}
            onClick={() => router.push(`/room/${room.id}`)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg shrink-0">
                {LANGUAGE_ICONS[room.language] || '📄'}
              </span>
              <div className="min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {room.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {timeAgo(room.lastVisited)} · {room.language}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-xs px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
              >
                Rejoin →
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(room.id); }}
                className="text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                style={{ color: 'var(--text-secondary)' }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}