'use client';

import { useEffect, useRef } from 'react';

// Each remote user's cursor is rendered as a Monaco editor decoration
// This component manages adding/updating/removing those decorations
export default function UserCursors({ editorRef, cursors, currentUserId }) {
  // Track decoration IDs so we can update/remove them later
  // Structure: { userId: [decorationId, ...] }
  const decorationsRef = useRef({});

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // For each remote cursor, create or update its decoration
    Object.entries(cursors).forEach(([userId, cursorData]) => {
      // Don't render our own cursor — Monaco handles that natively
      if (userId === currentUserId) return;
      if (!cursorData || !cursorData.position) return;

      const { position, color, name } = cursorData;

      // Monaco positions use 1-based line numbers and columns
      const lineNumber = position.lineNumber || 1;
      const column = position.column || 1;

      // Create a unique CSS class name for this user's colour
      const colorClass = `cursor-${userId.replace(/[^a-z0-9]/gi, '')}`;

      // Inject a CSS rule for this user's cursor colour dynamically
      injectCursorStyle(colorClass, color, name);

      // Define the decoration — this tells Monaco where and how to render it
      const decorations = [
        {
          range: {
            startLineNumber: lineNumber,
            startColumn: column,
            endLineNumber: lineNumber,
            endColumn: column + 1,
          },
          options: {
            // className applies to the text range (the character the cursor is on)
            className: `${colorClass}-highlight`,
            // beforeContentClassName renders the blinking cursor bar
            beforeContentClassName: `${colorClass}-cursor`,
            // stickiness: cursor stays with adjacent content when text is inserted
            stickiness: 1,
          },
        },
      ];

      // Update existing decorations or create new ones
      if (decorationsRef.current[userId]) {
        decorationsRef.current[userId] = editor.deltaDecorations(
          decorationsRef.current[userId],
          decorations
        );
      } else {
        decorationsRef.current[userId] = editor.deltaDecorations(
          [],
          decorations
        );
      }
    });

    // Remove decorations for users who have left
    Object.keys(decorationsRef.current).forEach((userId) => {
      if (!cursors[userId]) {
        editor.deltaDecorations(decorationsRef.current[userId], []);
        delete decorationsRef.current[userId];
        removeCursorStyle(`cursor-${userId.replace(/[^a-z0-9]/gi, '')}`);
      }
    });
  }, [cursors, currentUserId, editorRef]);

  // This component doesn't render any visible DOM elements itself —
  // everything is injected into Monaco's canvas via decorations
  return null;
}

// Dynamically inject CSS for a user's cursor colour
// We do this in JS because each user gets a unique runtime colour
function injectCursorStyle(className, color, name) {
  const styleId = `style-${className}`;
  if (document.getElementById(styleId)) return; // already injected

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Blinking cursor bar */
    .${className}-cursor {
      border-left: 2px solid ${color};
      height: 100% !important;
      animation: cursor-blink 1s ease-in-out infinite;
      position: relative;
    }

    /* Name label that floats above the cursor */
    .${className}-cursor::before {
      content: '${name.replace(/'/g, "\\'")}';
      position: absolute;
      top: -20px;
      left: -1px;
      background: ${color};
      color: #fff;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      padding: 1px 5px;
      border-radius: 3px 3px 3px 0;
      white-space: nowrap;
      pointer-events: none;
      z-index: 100;
    }

    /* Subtle background highlight on the character at the cursor */
    .${className}-highlight {
      background: ${color}33;
    }

    @keyframes cursor-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function removeCursorStyle(className) {
  const style = document.getElementById(`style-${className}`);
  if (style) style.remove();
}