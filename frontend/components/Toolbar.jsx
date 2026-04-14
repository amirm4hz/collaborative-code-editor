'use client';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'typescript', label: 'TypeScript' },
];

export default function Toolbar({
  roomName,
  language,
  onLanguageChange,
  isDark,
  onThemeToggle,
  isConnected,
  onShare,
  onRun,
  isRunning,
}) {
  return (
    <header
      className="flex items-center justify-between px-4 py-2 border-b shrink-0"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="text-sm transition-colors hover:text-indigo-400"
          style={{ color: 'var(--text-secondary)' }}
        >
          ← Home
        </a>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {roomName}
        </span>

        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
            style={{ boxShadow: isConnected ? '0 0 6px #4ade80' : '0 0 6px #f87171' }}
          />
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
          }}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        <button
          onClick={onThemeToggle}
          className="p-1.5 rounded-lg transition-colors"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          aria-label="Toggle theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <button onClick={onShare} className="btn-secondary text-sm py-1.5 px-3">
          🔗 Share
        </button>

        {/* Run Code button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="btn-primary text-sm py-1.5 px-4 flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>▶ Run</>
          )}
        </button>
      </div>
    </header>
  );
}