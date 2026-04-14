'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '../../../hooks/useSocket';
import Editor from '../../../components/Editor';
import Toolbar from '../../../components/Toolbar';
import UserList from '../../../components/UserList';
import OutputPanel from '../../../components/OutputPanel';

export default function RoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const pyodideRef = useRef(null);

  const [roomMeta, setRoomMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [userName, setUserName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Code execution state
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);

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
    emitCodeChange,
    emitLanguageChange,
    emitCursorMove,
  } = useSocket(
    nameSubmitted
      ? { roomId, userName }
      : { roomId: null, userName: null }
  );

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

  async function handleRun() {
    if (isRunning) return;
    setIsRunning(true);
    setOutput(null);

    if (language === 'typescript') {
      try {
        // Load TypeScript compiler from CDN on first use
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

        // Transpile TypeScript to JavaScript using the TS compiler
        const result = window.ts.transpileModule(code, {
          compilerOptions: {
            target: window.ts.ScriptTarget.ES2020,
            module: window.ts.ModuleKind.None,
            strict: false,
          },
        });

        // Run the transpiled JS in our sandboxed Web Worker
        const workerCode = await fetch('/jsWorker.js').then(r => r.text());
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = (e) => {
          setOutput(e.data);
          setIsRunning(false);
          worker.terminate();
        };

        worker.onerror = (e) => {
          setOutput({ success: false, output: `Worker error: ${e.message}` });
          setIsRunning(false);
          worker.terminate();
        };

        worker.postMessage({ code: result.outputText });
      } catch (err) {
        setOutput({ success: false, output: `TypeScript error: ${err.message}` });
        setIsRunning(false);
      }
      return;
    }

    // --- JavaScript — run in a sandboxed Web Worker ---
    if (language === 'javascript') {
      try {
        const workerCode = await fetch('/jsWorker.js').then(r => r.text());
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = (e) => {
          setOutput(e.data);
          setIsRunning(false);
          worker.terminate();
        };

        worker.onerror = (e) => {
          setOutput({ success: false, output: `Worker error: ${e.message}` });
          setIsRunning(false);
          worker.terminate();
        };

        worker.postMessage({ code });
      } catch (err) {
        setOutput({ success: false, output: `Failed to start worker: ${err.message}` });
        setIsRunning(false);
      }
      return;
    }

    // --- Python — run via Pyodide (WebAssembly) ---
    if (language === 'python') {
      try {
        // Load Pyodide on first use — ~10MB download, cached after that
        if (!pyodideRef.current) {
          setPyodideLoading(true);
          setLoadingMessage('Loading Python runtime (first run only)...');

          // Dynamically load the Pyodide script from CDN
          await new Promise((resolve, reject) => {
            if (document.getElementById('pyodide-script')) {
              resolve();
              return;
            }
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

        // Capture stdout and stderr
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
        setOutput({
          success: false,
          output: err.message || 'Python execution failed',
        });
      } finally {
        setIsRunning(false);
        setLoadingMessage('');
      }
      return;
    }
  }

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
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {fetchError || socketError}
          </p>
          <button className="btn-primary" onClick={() => router.push('/')}>
            Go Home
          </button>
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
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            What should we call you?
          </p>
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
            <button type="submit" className="btn-primary">
              Enter Room →
            </button>
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
        onLanguageChange={emitLanguageChange}
        isDark={isDark}
        onThemeToggle={handleThemeToggle}
        isConnected={isConnected}
        onShare={handleShare}
        onRun={handleRun}
        isRunning={isRunning}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 overflow-hidden">
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
        <UserList
          users={users}
          currentUserId={currentUser?.id}
        />
      </div>
    </div>
  );
}