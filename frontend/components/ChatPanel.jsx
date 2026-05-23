'use client';

import { useState, useEffect, useRef } from 'react';

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatPanel({
  messages,
  users,
  currentUserId,
  onSendMessage,
  isConnected,
}) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'users'
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;
    onSendMessage(input.trim());
    setInput('');
    inputRef.current?.focus();
  }

  // Count unread — for future enhancement
  const onlineCount = users.length;

  return (
    <aside
      className="w-64 shrink-0 border-l flex flex-col"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
    >
      {/* Tab switcher — Chat / Users */}
      <div
        className="flex border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'chat'
              ? 'border-b-2 border-indigo-500'
              : ''
          }`}
          style={{
            color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
            activeTab === 'users'
              ? 'border-b-2 border-indigo-500'
              : ''
          }`}
          style={{
            color: activeTab === 'users' ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          👥 {onlineCount} Online
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <>
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {messages.length === 0 && (
              <p
                className="text-xs text-center mt-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                No messages yet.
                <br />Say hello! 👋
              </p>
            )}

            {messages.map((msg) => {
              // System messages (join/leave notifications)
              if (msg.system) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {msg.text}
                    </span>
                  </div>
                );
              }

              const isOwnMessage = msg.userId === currentUserId;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender name + time */}
                  <div className="flex items-center gap-1.5 mb-0.5 px-1">
                    {!isOwnMessage && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: msg.color }}
                      />
                    )}
                    <span
                      className="text-xs font-medium"
                      style={{ color: isOwnMessage ? 'var(--text-secondary)' : msg.color }}
                    >
                      {isOwnMessage ? 'you' : msg.name}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>

                  {/* Message bubble */}
                  <div
                    className="max-w-[90%] px-3 py-1.5 rounded-2xl text-sm break-words"
                    style={{
                      background: isOwnMessage
                        ? '#6366f1'
                        : 'var(--bg-surface)',
                      color: isOwnMessage
                        ? '#ffffff'
                        : 'var(--text-primary)',
                      borderRadius: isOwnMessage
                        ? '18px 18px 4px 18px'
                        : '18px 18px 18px 4px',
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Invisible div to scroll to */}
            <div ref={bottomRef} />
          </div>

          {/* Message input */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                className="input-field text-sm py-2 flex-1 min-w-0"
                type="text"
                placeholder={isConnected ? 'Message...' : 'Connecting...'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={500}
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!input.trim() || !isConnected}
                className="shrink-0 w-8 h-8 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <span className="text-white text-sm">↑</span>
              </button>
            </div>
          </form>
        </>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <ul className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm"
              style={{ background: 'var(--bg-surface)' }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: user.color }}
              />
              <span
                className="truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {user.name}
                {user.id === currentUserId && (
                  <span style={{ color: 'var(--text-secondary)' }}> (you)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}