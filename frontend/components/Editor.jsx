'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

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
}) {
  const editorRef = useRef(null);
  // Track whether a remote update is being applied
  // so we don't trigger onChange (which would emit back to server)
  const isRemoteUpdate = useRef(false);

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
    editor.focus();
  }

  // Apply remote code changes without triggering onChange
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentValue = editor.getValue();
    if (currentValue !== code) {
      isRemoteUpdate.current = true;

      // Save cursor position before updating
      const position = editor.getPosition();
      const selection = editor.getSelection();

      editor.setValue(code);

      // Restore cursor position after update
      if (position) editor.setPosition(position);
      if (selection) editor.setSelection(selection);

      isRemoteUpdate.current = false;
    }
  }, [code]);

  function handleChange(value) {
    // Don't emit if this change came from a remote update
    if (isRemoteUpdate.current) return;
    onChange(value || '');
  }

  return (
    <div className="flex-1 overflow-hidden">
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
    </div>
  );
}