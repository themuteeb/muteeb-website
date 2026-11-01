// Sends one page view per browser tab, then a heartbeat every minute while the tab is visible.
const SESSION_KEY = 'muteeb-visit-id';
const HEARTBEAT_MS = 60 * 1000;

function newId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing && /^[a-zA-Z0-9-]{16,64}$/.test(existing)) return existing;
    const id = newId();
    window.sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

function send(kind: 'view' | 'ping') {
  const body = JSON.stringify({
    sessionId: getSessionId(),
    kind,
    path: window.location.pathname || '/',
    referrer: document.referrer || '',
  });
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* analytics must never affect the site */
  });
}

/** Starts tracking. Returns a cleanup function. */
export function startVisitTracking(): () => void {
  send('view');
  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') send('ping');
  }, HEARTBEAT_MS);
  return () => window.clearInterval(timer);
}
