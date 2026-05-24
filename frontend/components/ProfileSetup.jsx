'use client';

import { useState } from 'react';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F0A500', '#00B894',
];

export default function ProfileSetup({ onSave, initialName = '' }) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), color);
  }

  return (
    <div className="card max-w-sm w-full">
      <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
        Set up your profile
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        Choose a name and colour — saved locally on your device.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name input with avatar preview */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: color }}
          >
            {name.trim().charAt(0).toUpperCase() || '?'}
          </div>
          <input
            className="input-field flex-1"
            type="text"
            placeholder="Your display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
          />
        </div>

        {/* Colour picker */}
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
            Pick your cursor colour
          </p>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `3px solid white` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={!name.trim()}>
          Save Profile →
        </button>
      </form>
    </div>
  );
}