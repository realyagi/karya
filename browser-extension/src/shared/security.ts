export const DANGEROUS_PROTOCOLS = [
  'javascript:',
  'data:',
  'file:',
  'vbscript:',
  'chrome:',
  'chrome-extension:',
  'edge:',
  'about:',
];

export function validateUrl(rawUrl: string): { valid: boolean; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string.' };
  }

  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  for (const proto of DANGEROUS_PROTOCOLS) {
    if (lower.startsWith(proto)) {
      return { valid: false, error: `Protocol "${proto}" is not allowed for security reasons.` };
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http: and https: protocols are permitted.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

export function sanitizeText(text: string, maxLength = 30000): string {
  if (!text || typeof text !== 'string') return '';
  return text.slice(0, maxLength);
}
