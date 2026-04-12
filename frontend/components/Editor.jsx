'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Load Monaco Editor only in the browser, never on the server
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  { ssr: false }
);

// Maps our language values to Monaco's language identifiers
const MONACO_LANGUAGE_MAP = {
  javascript: 'javascript',
  python: 'python',
  c: 'c',
};

export default function Editor({
  code,
  language,
  isDark,
  onChange, // called when the local user types
}) {
  const editorRef = useRef(null); // holds the Monaco editor instance

  // When the editor first mounts, store a reference to it
  function handleEditorDidMount(editor) {
    editorRef.current = editor;

    // Focus the editor so the user can type immediately
    editor.focus();
  }

  // When we receive a code update from another user via Socket.io,
  // we need to update the editor content WITHOUT triggering onChange
  // (which would cause an infinite loop of emitting back to the server)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const currentValue = editor.getValue();
    // Only update if the value actually changed — avoids cursor jumping
    if (currentValue !== code) {
      // preserveViewState keeps the user's scroll position and cursor
      editor.setValue(code);
    }
  }, [code]);

  return (
    <div className="flex-1 overflow-hidden">
      <MonacoEditor
        height="100%"
        language={MONACO_LANGUAGE_MAP[language] || 'javascript'}
        value={code}
        theme={isDark ? 'vs-dark' : 'light'}
        onChange={(value) => onChange(value || '')}
        onMount={handleEditorDidMount}
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontLigatures: true,
          minimap: { enabled: false },   // hides the minimap on the right
          scrollBeyondLastLine: false,
          automaticLayout: true,          // resizes editor when window resizes
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