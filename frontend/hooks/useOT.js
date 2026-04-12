import { useRef, useCallback } from 'react';

// Operational Transform — client side
// Our implementation uses a simple but effective approach:
// each client tracks a "revision" number. When we send an operation,
// we tag it with our current revision. The server transforms it
// against any operations it received since that revision, then
// broadcasts the transformed operation to all other clients.

export function useOT({ roomId, socket }) {
  // Local revision counter — increments every time we apply an operation
  const revision = useRef(0);

  // Queue of operations we've sent but not yet acknowledged by the server
  // We need these to transform incoming operations against
  const pendingOps = useRef([]);

  // Convert a raw code change into an operation by diffing old vs new value
  // This is a simplified diff — for production you'd use a proper diff algorithm
  function createOperation(oldCode, newCode) {
    // Find the first position where the strings differ
    let start = 0;
    while (start < oldCode.length && start < newCode.length && oldCode[start] === newCode[start]) {
      start++;
    }

    // Find the last position where they differ (working backwards)
    let oldEnd = oldCode.length;
    let newEnd = newCode.length;
    while (
      oldEnd > start &&
      newEnd > start &&
      oldCode[oldEnd - 1] === newCode[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }

    const deletedText = oldCode.slice(start, oldEnd);
    const insertedText = newCode.slice(start, newEnd);

    // Build a compound operation that describes the full change
    const ops = [];

    if (deletedText.length > 0) {
      ops.push({ type: 'delete', position: start, value: deletedText });
    }
    if (insertedText.length > 0) {
      ops.push({ type: 'insert', position: start, value: insertedText });
    }

    return ops;
  }

  // Transform operation A against operation B
  // Returns A adjusted for the fact that B has already been applied
  function transformOp(opA, opB) {
    if (opA.type === 'insert' && opB.type === 'insert') {
      // If B inserted before A's position, A's position shifts right
      if (opB.position <= opA.position) {
        return { ...opA, position: opA.position + opB.value.length };
      }
      return opA;
    }

    if (opA.type === 'insert' && opB.type === 'delete') {
      // If B deleted before A's position, A's position shifts left
      if (opB.position < opA.position) {
        return {
          ...opA,
          position: Math.max(opA.position - opB.value.length, opB.position),
        };
      }
      return opA;
    }

    if (opA.type === 'delete' && opB.type === 'insert') {
      // If B inserted before A's position, A's position shifts right
      if (opB.position <= opA.position) {
        return { ...opA, position: opA.position + opB.value.length };
      }
      return opA;
    }

    if (opA.type === 'delete' && opB.type === 'delete') {
      if (opB.position < opA.position) {
        return {
          ...opA,
          position: Math.max(opA.position - opB.value.length, opB.position),
        };
      }
      return opA;
    }

    return opA;
  }

  // Apply an operation to a string and return the new string
  function applyOp(code, op) {
    if (op.type === 'insert') {
      return code.slice(0, op.position) + op.value + code.slice(op.position);
    }
    if (op.type === 'delete') {
      return code.slice(0, op.position) + code.slice(op.position + op.value.length);
    }
    return code;
  }

  // Called when the LOCAL user types something
  // oldCode = what was in the editor before, newCode = what's there now
  const submitOperation = useCallback((oldCode, newCode) => {
    const ops = createOperation(oldCode, newCode);
    if (ops.length === 0) return newCode;

    // Tag each op with our current revision so the server knows
    // what state we were at when we made this change
    const taggedOps = ops.map(op => ({
      ...op,
      revision: revision.current,
      roomId,
    }));

    // Add to pending queue before sending
    pendingOps.current.push(...taggedOps);

    // Send to server
    taggedOps.forEach(op => {
      socket.emit('ot:operation', op);
    });

    return newCode;
  }, [roomId, socket]);

  // Called when we receive an operation FROM another user via the server
  // We need to transform it against our pending (unacknowledged) ops first
  const receiveOperation = useCallback((op, currentCode) => {
    // Transform the incoming op against all our pending ops
    let transformedOp = op;
    for (const pendingOp of pendingOps.current) {
      transformedOp = transformOp(transformedOp, pendingOp);
    }

    // Apply the transformed operation to get the new code
    const newCode = applyOp(currentCode, transformedOp);

    // Increment our revision
    revision.current += 1;

    return newCode;
  }, []);

  // Called when server acknowledges our operation
  // Remove it from the pending queue
  const acknowledgeOperation = useCallback(() => {
    pendingOps.current.shift();
    revision.current += 1;
  }, []);

  return {
    submitOperation,
    receiveOperation,
    acknowledgeOperation,
  };
}