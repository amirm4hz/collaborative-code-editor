'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import UserCursors from './UserCursors';

const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
);

const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  python: 'python',
  c: 'c',
};

export default function Editor({
  code,
  language,
  isDark,
  onChange,
  onCursorMove, // called when our cursor position changes
  cursors,      // remote users' cursor positions
  currentUserId,
}) {
  const editorRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    editor.focus();

    // Listen for cursor position changes and emit them
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorMove) {
        onCursorMove({
          lineNumber: e.position.lineNumber,
          column: e.position.column,
        });
      }
    });
  }

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentValue = editor.getValue();
    if (currentValue !== code) {
      isRemoteUpdate.current = true;

      const position = editor.getPosition();
      const selection = editor.getSelection();

      editor.setValue(code);

      if (position) editor.setPosition(position);
      if (selection) editor.setSelection(selection);

      isRemoteUpdate.current = false;
    }
  }, [code]);

  function handleChange(value) {
    if (isRemoteUpdate.current) return;
    onChange(value || '');
  }

  return (
    <div className="flex-1 overflow-hidden relative">
      <MonacoEditor
        height="100%"
        language={MONACO_LANGUAGE_MAP[language] || 'javascript'}
        value={code}
        theme={isDark ? 'vs-dark' : 'light'}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
      {/* Render remote cursors as Monaco decorations */}
      <UserCursors
        editorRef={editorRef}
        cursors={cursors || {}}
        currentUserId={currentUserId}
      />
    </div>
  );
}