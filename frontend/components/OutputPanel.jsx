'use client';

export default function OutputPanel({ output, isRunning, loadingMessage, onClose }) {
  if (!output && !isRunning) return null;

  const isError = output && !output.success;

  return (
    <div
      className="shrink-0 border-t flex flex-col"
      style={{
        borderColor: 'var(--border)',
        background: '#0d0d0d',
        height: '220px',
      }}
    >
      {/* Terminal header bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: '#2a2a2a', background: '#1a1a1a' }}
      >
        <div className="flex items-center gap-3">
          {/* Traffic light dots like a real terminal */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs font-mono" style={{ color: '#666' }}>
            output
          </span>

          {/* Status badge */}
          {output && !isRunning && (
            <span
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                output.success
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {output.success ? '✓ success' : '✗ error'}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-xs font-mono px-2 py-0.5 rounded transition-colors hover:bg-white/10"
          style={{ color: '#666' }}
          aria-label="Close output"
        >
          ✕
        </button>
      </div>

      {/* Terminal output body */}
      <div className="flex-1 overflow-auto p-4 font-mono text-sm">
        {isRunning ? (
          <div className="flex items-center gap-2" style={{ color: '#666' }}>
            <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-green-400">
              {loadingMessage || 'Running...'}
            </span>
          </div>
        ) : (
          <pre
            className="whitespace-pre-wrap break-words leading-relaxed"
            style={{ color: isError ? '#f87171' : '#4ade80' }}
          >
            {/* Terminal prompt line */}
            <span style={{ color: '#666' }}>$ run</span>
            {'\n'}
            {output?.output || output?.stdout || output?.stderr || '(no output)'}
          </pre>
        )}
      </div>
    </div>
  );
}