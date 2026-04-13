// This file runs inside a Web Worker — completely isolated from the main page
// Web Workers have no access to DOM, window, or localStorage
// This makes eval() safe to use here — it can't affect the main page

self.onmessage = function (e) {
  const { code } = e.data;

  // Capture console.log output by overriding it inside the worker
  const logs = [];
  self.console = {
    log: (...args) => logs.push(args.map(String).join(' ')),
    error: (...args) => logs.push('Error: ' + args.map(String).join(' ')),
    warn: (...args) => logs.push('Warning: ' + args.map(String).join(' ')),
  };

  // Set a timeout to kill infinite loops after 5 seconds
  const timeout = setTimeout(() => {
    self.postMessage({
      success: false,
      output: 'Error: Execution timed out after 5 seconds. Check for infinite loops.',
    });
    self.close();
  }, 5000);

  try {
    // Run the user's code
    eval(code); // eslint-disable-line no-eval
    clearTimeout(timeout);
    self.postMessage({
      success: true,
      output: logs.join('\n') || '(no output)',
    });
  } catch (err) {
    clearTimeout(timeout);
    self.postMessage({
      success: false,
      output: `${err.name}: ${err.message}`,
    });
  }
};