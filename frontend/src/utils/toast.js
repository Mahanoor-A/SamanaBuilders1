// Simple toast utility - uses a global event system so pages don't need a toast library
const listeners = [];

function emit(event) {
  listeners.forEach((fn) => fn(event));
}

export const toast = {
  success: (message) => emit({ type: 'success', message }),
  error: (message) => emit({ type: 'error', message }),
  info: (message) => emit({ type: 'info', message }),
  warning: (message) => emit({ type: 'warning', message }),
  subscribe: (fn) => {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  },
};