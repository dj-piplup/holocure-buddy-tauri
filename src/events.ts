declare global {
  interface Window {
    registeredEvents: {target: HTMLElement | Window, type: keyof HTMLElementEventMap | keyof WindowEventMap, callback: () => void}[];
  }
}

window.registeredEvents ??= [];

export function attachListener<T extends Window | HTMLElement>(
  target: T,
  type: T extends Window ? keyof WindowEventMap : keyof HTMLElementEventMap,
  callback: () => void
) {
  target.addEventListener(type, callback);
  window.registeredEvents.push({
    target,
    type,
    callback,
  });
}

export function removeListener(
  ...[target, type, callback]: Parameters<typeof attachListener>
) {
  target.removeEventListener(type, callback);
  const i = window.registeredEvents.findIndex(
    (e) => e.target === target && e.type === type && e.callback === callback
  );
  if (i >= 0) {
    window.registeredEvents.splice(i, 1);
  }
}

export function cleanupListeners() {
  window.registeredEvents.forEach(({target, type, callback}) => {
    target.removeEventListener(type, callback);
  })
}