// SHA-256 Hashing Helper using Web Crypto API
export async function hashPasscode(passcode: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(passcode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Sanitizes user input text to prevent XSS / HTML injection
export function sanitizeInput(str: string, maxLength: number = 500): string {
  if (!str) return '';
  const trimmed = str.trim().slice(0, maxLength);
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
