'use client';

export default function UserList({ users, currentUserId }) {
  return (
    <aside
      className="w-48 shrink-0 border-l flex flex-col"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      <div
        className="px-3 py-2 border-b text-xs font-semibold uppercase tracking-wider"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        Online — {users.length}
      </div>

      <ul className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm"
            style={{ background: 'var(--bg-surface)' }}
          >
            {/* Coloured dot matching their cursor colour */}
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: user.color }}
            />
            <span
              className="truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {user.name}
              {user.id === currentUserId && (
                <span style={{ color: 'var(--text-secondary)' }}> (you)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}