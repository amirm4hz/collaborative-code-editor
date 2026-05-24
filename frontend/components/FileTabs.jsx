'use client';

import { useState } from 'react';

const LANGUAGE_ICONS = {
  javascript: '🟨',
  typescript: '🔷',
  python: '🐍',
};

const LANGUAGE_EXTENSIONS = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
};

export default function FileTabs({
  files,
  activeFileId,
  onSwitch,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  currentLanguage,
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('javascript');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const ext = LANGUAGE_EXTENSIONS[newFileLang];
    const name = newFileName.endsWith(ext)
      ? newFileName
      : newFileName + ext;

    onCreateFile(name, newFileLang);
    setNewFileName('');
    setIsCreating(false);
  }

  function startRename(file) {
    setRenamingId(file.id);
    setRenameValue(file.name);
  }

  function handleRename(e, fileId) {
    e.preventDefault();
    if (!renameValue.trim()) return;
    onRenameFile(fileId, renameValue.trim());
    setRenamingId(null);
  }

  return (
    <div
      className="flex items-center border-b overflow-x-auto shrink-0"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-secondary)',
        minHeight: '36px',
      }}
    >
      {/* File tabs */}
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        const isRenaming = renamingId === file.id;

        return (
          <div
            key={file.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-r shrink-0 group cursor-pointer transition-colors ${
              isActive ? 'border-t-2 border-t-indigo-500' : 'hover:bg-[var(--bg-surface)]'
            }`}
            style={{
              borderRightColor: 'var(--border)',
              background: isActive ? 'var(--bg-primary)' : 'transparent',
              borderTopColor: isActive ? '#6366f1' : 'transparent',
            }}
            onClick={() => !isRenaming && onSwitch(file.id)}
          >
            <span className="text-xs">
              {LANGUAGE_ICONS[file.language] || '📄'}
            </span>

            {isRenaming ? (
              <form onSubmit={(e) => handleRename(e, file.id)} onClick={e => e.stopPropagation()}>
                <input
                  className="text-xs bg-transparent border-b border-indigo-500 outline-none w-24"
                  style={{ color: 'var(--text-primary)' }}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => setRenamingId(null)}
                  autoFocus
                />
              </form>
            ) : (
              <span
                className="text-xs max-w-[100px] truncate"
                style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                onDoubleClick={(e) => { e.stopPropagation(); startRename(file); }}
              >
                {file.name}
              </span>
            )}

            {/* Delete button — shows on hover, hidden for single file */}
            {files.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs ml-1 hover:text-red-400"
                style={{ color: 'var(--text-secondary)' }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}

      {/* New file button */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="px-3 py-1.5 text-xs shrink-0 hover:bg-[var(--bg-surface)] transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="New file"
        >
          + New File
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="flex items-center gap-1.5 px-2 shrink-0"
        >
          <input
            className="text-xs px-2 py-1 rounded border outline-none w-28"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            placeholder="filename"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
          />
          <select
            className="text-xs px-1 py-1 rounded border"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
            value={newFileLang}
            onChange={(e) => setNewFileLang(e.target.value)}
          >
            <option value="javascript">JS</option>
            <option value="typescript">TS</option>
            <option value="python">PY</option>
          </select>
          <button type="submit" className="text-xs text-indigo-400 hover:text-indigo-300">
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            ✕
          </button>
        </form>
      )}
    </div>
  );
}