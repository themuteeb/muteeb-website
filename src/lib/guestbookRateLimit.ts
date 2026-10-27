export const GUESTBOOK_COOLDOWN_MS = 6 * 60 * 60 * 1000;
export const GUESTBOOK_COOLDOWN_STORAGE_KEY = 'muteeb-guestbook-cooldown-until';
export const GUESTBOOK_CLIENT_ID_STORAGE_KEY = 'muteeb-guestbook-client-id';
export const GUESTBOOK_COOLDOWN_MESSAGE =
  'Your message is already awaiting for approval, try again later.';

export function getGuestbookClientId(): string {
  try {
    const existing = window.localStorage.getItem(GUESTBOOK_CLIENT_ID_STORAGE_KEY);
    if (existing && /^[a-zA-Z0-9-]{16,64}$/.test(existing)) return existing;

    const clientId = window.crypto?.randomUUID?.()
      || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(GUESTBOOK_CLIENT_ID_STORAGE_KEY, clientId);
    return clientId;
  } catch {
    return '';
  }
}

export class GuestbookRateLimitError extends Error {
  retryAfterMs: number;

  constructor(retryAfterMs = GUESTBOOK_COOLDOWN_MS, message = GUESTBOOK_COOLDOWN_MESSAGE) {
    super(message);
    this.name = 'GuestbookRateLimitError';
    this.retryAfterMs = retryAfterMs;
  }
}
