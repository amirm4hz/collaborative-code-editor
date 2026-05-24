'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../hooks/useSocket';
import Editor from '../../../components/Editor';
import Toolbar from '../../../components/Toolbar';
import ChatPanel from '../../../components/ChatPanel';
import OutputPanel from '../../../components/OutputPanel';
import FileTabs from '../../../components/FileTabs';

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();

  const [roomMeta, setRoomMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [userName, setUserName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const pyodideRef = useRef(null);

  useEffect(() => {
    async function fetchRoom() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}`
        );
        if (!res.ok) throw new Error('Room not found');
        const data = await res.json();
        setRoomMeta(data);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRoom();
    const saved = localStorage.getItem('theme') || 'dark';
    setIsDark(saved === 'dark');
  }, [roomId]);

  const {
    isConnected,
    currentUser,
    users,
    code,
    language,
    error: socketError,
    cursors,
    messages,
    files,
    activeFileId,
    emitCodeChange,
    emitLanguageChange,
    emitCursorMove,
    emitChatMessage,
    emitFileSwitch,
    emitFileCreated,
    emitFileDeleted,
    emitFileRenamed,
    setFiles,
    setActiveFileId,
    setCode,
    setLanguage,
  } = useSocket(
    nameSubmitted
      ? { roomId, userName }
      : { roomId: null, userName: null }
  );

  // Sync files from roomMeta into socket state on join
  useEffect(() => {
    if (roomMeta?.files && nameSubmitted) {
      setFiles(roomMeta.files);
      setActiveFileId(roomMeta.activeFileId);
      const activeFile = roomMeta.files.find(f => f.id === roomMeta.activeFileId);
      if (activeFile) {
        setCode(activeFile.code || '');
        setLanguage(activeFile.language || 'javascript');
      }
    }
  }, [roomMeta, nameSubmitted]);

  // When active file changes, load that file's code and language
  const activeFile = files.find(f => f.id === activeFileId);

  function handleThemeToggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    alert('Room link copied to clipboard!');
  }

  function handleNameSubmit(e) {
    e.preventDefault();
    if (!userName.trim()) return;
    setNameSubmitted(true);
  }

  // Switch to a different file
  async function handleFileSwitch(fileId) {
    if (fileId === activeFileId) return;

    // Save current file's code first
    if (activeFileId) {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}/files/${activeFileId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }
      );
    }

    // Load the new file
    const newFile = files.find(f => f.id === fileId);
    if (newFile) {
      setCode(newFile.code || '');
      setLanguage(newFile.language || 'javascript');
    }

    emitFileSwitch(fileId);
    setOutput(null);
  }

  // Create a new file
  async function handleCreateFile(name, lang) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}/files`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, language: lang }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
        return;
      }

      const newFile = await res.json();
      setFiles(prev => [...prev, newFile]);
      emitFileCreated(newFile);

      // Switch to the new file
      await handleFileSwitch(newFile.id);
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  }

  // Delete a file
  async function handleDeleteFile(fileId) {
    if (files.length <= 1) return;

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}/files/${fileId}`,
        { method: 'DELETE' }
      );

      const remaining = files.filter(f => f.id !== fileId);
      const newActiveId = activeFileId === fileId
        ? remaining[0]?.id
        : activeFileId;

      setFiles(remaining);
      emitFileDeleted(fileId, newActiveId);

      if (activeFileId === fileId && newActiveId) {
        await handleFileSwitch(newActiveId);
      }
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  }

  // Rename a file
  async function handleRenameFile(fileId, name) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}/files/${fileId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        }
      );
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name } : f));
      emitFileRenamed(fileId, name);
    } catch (err) {
      console.error('Failed to rename file:', err);
    }
  }

  // Run code
  async function handleRun() {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(null);

    if (language === 'typescript') {
      try {
        await new Promise((resolve, reject) => {
          if (window.ts) { resolve(); return; }
          if (document.getElementById('ts-script')) { resolve(); return; }
          const script = document.createElement('script');
          script.id = 'ts-script';
          script.src = 'https://cdn.jsdelivr.net/npm/typescript@5.3.3/lib/typescript.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        const result = window.ts.transpileModule(code, {
          compilerOptions: {
            target: window.ts.ScriptTarget.ES2020,
            module: window.ts.ModuleKind.None,
            strict: false,
          },
        });
        const workerCode = await fetch('/jsWorker.js').then(r => r.text());
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = (e) => { setOutput(e.data); setIsRunning(false); worker.terminate(); };
        worker.onerror = (e) => { setOutput({ success: false, output: `Worker error: ${e.message}` }); setIsRunning(false); worker.terminate(); };
        worker.postMessage({ code: result.outputText });
      } catch (err) {
        setOutput({ success: false, output: `TypeScript error: ${err.message}` });
        setIsRunning(false);
      }
      return;
    }

    if (language === 'javascript') {
      try {
        const workerCode = await fetch('/jsWorker.js').then(r => r.text());
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));
        worker.onmessage = (e) => { setOutput(e.data); setIsRunning(false); worker.terminate(); };
        worker.onerror = (e) => { setOutput({ success: false, output: `Worker error: ${e.message}` }); setIsRunning(false); worker.terminate(); };
        worker.postMessage({ code });
      } catch (err) {
        setOutput({ success: false, output: `Failed to start worker: ${err.message}` });
        setIsRunning(false);
      }
      return;
    }

    if (language === 'python') {
      try {
        if (!pyodideRef.current) {
          setPyodideLoading(true);
          setLoadingMessage('Loading Python runtime (first run only)...');
          await new Promise((resolve, reject) => {
            if (document.getElementById('pyodide-script')) { resolve(); return; }
            const script = document.createElement('script');
            script.id = 'pyodide-script';
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
          setLoadingMessage('Initialising Python interpreter...');
          pyodideRef.current = await window.loadPyodide();
          setPyodideLoading(false);
        }
        setLoadingMessage('Running...');
        const pyodide = pyodideRef.current;
        let stdout = '';
        let stderr = '';
        pyodide.setStdout({ batched: (text) => { stdout += text + '\n'; } });
        pyodide.setStderr({ batched: (text) => { stderr += text + '\n'; } });
        await pyodide.runPythonAsync(code);
        setOutput({
          success: stderr === '',
          output: (stdout + stderr).trim() || '(no output)',
        });
      } catch (err) {
        setOutput({ success: false, output: err.message || 'Python execution failed' });
      } finally {
        setIsRunning(false);
        setLoadingMessage('');
      }
      return;
    }
  }

  // Loading states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading room...</p>
        </div>
      </div>
    );
  }

  if (fetchError || socketError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="card text-center max-w-md">
          <p className="text-4xl mb-4">🚫</p>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            {fetchError ? 'Room not found' : 'Connection error'}
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>{fetchError || socketError}</p>
          <button className="btn-primary" onClick={() => router.push('/')}>Go Home</button>
        </div>
      </div>
    );
  }

  if (!nameSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="card max-w-sm w-full">
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            Joining: <span className="text-indigo-400">{roomMeta?.name}</span>
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>What should we call you?</p>
          <form onSubmit={handleNameSubmit} className="flex flex-col gap-3">
            <input
              className="input-field"
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={30}
              autoFocus
            />
            <button type="submit" className="btn-primary">Enter Room →</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Toolbar
        roomName={roomMeta?.name}
        language={language}
        onLanguageChange={(lang) => {
          emitLanguageChange(lang);
          if (activeFileId) {
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/${roomId}/files/${activeFileId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ language: lang }),
            });
            setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, language: lang } : f));
          }
        }}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        isConnected={isConnected}
        onShare={handleShare}
        onRun={handleRun}
        isRunning={isRunning}
        onChatToggle={() => setChatOpen(prev => !prev)}
        unreadCount={chatOpen ? 0 : messages.length}
      />

      {/* File tabs bar */}
      {files.length > 0 && (
        <FileTabs
          files={files}
          activeFileId={activeFileId}
          onSwitch={handleFileSwitch}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
          onRenameFile={handleRenameFile}
          currentLanguage={language}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Editor
            code={code}
            language={language}
            isDark={isDark}
            onChange={emitCodeChange}
            onCursorMove={emitCursorMove}
            cursors={cursors}
            currentUserId={currentUser?.id}
          />
          <OutputPanel
            output={output}
            isRunning={isRunning || pyodideLoading}
            loadingMessage={loadingMessage}
            onClose={() => setOutput(null)}
          />
        </div>

        {chatOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-10 md:hidden"
              onClick={() => setChatOpen(false)}
            />
            <div className="fixed right-0 top-0 h-full z-20 w-72 md:relative md:z-auto md:w-64">
              <ChatPanel
                messages={messages}
                users={users}
                currentUserId={currentUser?.id}
                onSendMessage={emitChatMessage}
                isConnected={isConnected}
                onClose={() => setChatOpen(false)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}