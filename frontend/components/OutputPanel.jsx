'use client';

export default function OutputPanel({ output, isRunning, onClose }) {
  if (!output && !isRunning) return null;

  // Combine all output types into one display
  function getDisplayOutput() {
    if (!output) return '';

    const parts = [];

    if (output.compileOutput) {
      parts.push(`Compile Error:\n${output.compileOutput}`);
    }
    if (output.stderr) {
      parts.push(`Error:\n${output.stderr}`);
    }
    if (output.stdout) {
      parts.push(output.stdout);
    }
    if (!output.stdout && !output.stderr && !output.compileOutput) {
      parts.push('(no output)');
    }

    return parts.join('\n');
  }

  const displayText = getDisplayOutput();
  const isError = output && !output.success;

  return (
    <div
      className="shrink-0 border-t flex flex-col"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-secondary)',
        height: '200px',
      }}
    >
      {/* Output panel header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Output
          </span>

          {/* Status badge */}
          {output && !isRunning && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                output.success
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {output.status}
            </span>
          )}

          {/* Execution stats */}
          {output?.success && output.time && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {output.time}s · {output.memory ? `${Math.round(output.memory / 1024)}MB` : ''}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-sm px-2 py-0.5 rounded transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Close output"
        >
          ✕
        </button>
      </div>

      {/* Output content */}
      <div className="flex-1 overflow-auto p-4">
        {isRunning ? (
          <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Running...</span>
          </div>
        ) : (
          <pre
            className="text-sm font-mono whitespace-pre-wrap break-words"
            style={{ color: isError ? '#f87171' : '#4ade80' }}
          >
            {displayText}
          </pre>
        )}
      </div>
    </div>
  );
}