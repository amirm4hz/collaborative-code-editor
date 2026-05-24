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
  onChatToggle,
  unreadCount,
}) {
  return (
    <header
      className="flex items-center justify-between px-3 py-2 border-b shrink-0 gap-2"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Left side — home + room name + status */}
      <div className="flex items-center gap-2 min-w-0">
        <a
          href="/"
          className="text-sm shrink-0 transition-colors hover:text-indigo-400"
          style={{ color: 'var(--text-secondary)' }}
        >
          ←
        </a>
        <span
          className="font-semibold text-sm truncate max-w-[80px] md:max-w-[160px]"
          style={{ color: 'var(--text-primary)' }}
        >
          {roomName}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
            style={{ boxShadow: isConnected ? '0 0 6px #4ade80' : '0 0 6px #f87171' }}
          />
          <span className="text-xs hidden md:inline" style={{ color: 'var(--text-secondary)' }}>
            {isConnected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Right side — controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Language selector */}
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg border transition-colors"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            borderColor: 'var(--border)',
            maxWidth: '110px',
          }}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="p-1.5 rounded-lg transition-colors shrink-0"
          style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
          aria-label="Toggle theme"
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Share — icon only on mobile */}
        <button
          onClick={onShare}
          className="p-1.5 rounded-lg border transition-colors shrink-0"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          aria-label="Share"
        >
          <span className="hidden md:inline text-sm">🔗 Share</span>
          <span className="md:hidden text-sm">🔗</span>
        </button>

        {/* Chat toggle */}
        <button
          onClick={onChatToggle}
          className="p-1.5 rounded-lg border transition-colors shrink-0 relative"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          aria-label="Chat"
        >
          💬
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Run button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
        >
          {isRunning ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            '▶ Run'
          )}
        </button>
      </div>
    </header>
  );
}