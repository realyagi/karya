import path from 'path';
import os from 'os';

export function validateSafeUrl(rawUrl: string): { valid: boolean; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string.' };
  }
  const lower = rawUrl.trim().toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('file:') || lower.startsWith('vbscript:')) {
    return { valid: false, error: 'Potentially dangerous URL scheme rejected.' };
  }
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http and https protocols are supported.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

export function getSafeBaseDirectory(): string {
  // Default safe root: Documents/Karya or user Desktop
  const karyaDir = path.join(os.homedir(), 'Documents', 'Karya');
  return karyaDir;
}

export function validateFilePath(filename: string, subfolder?: string): { safePath: string | null; error?: string } {
  if (!filename || typeof filename !== 'string') {
    return { safePath: null, error: 'Filename is required.' };
  }

  // Prevent path traversal
  if (filename.includes('..') || path.isAbsolute(filename)) {
    return { safePath: null, error: 'Path traversal or absolute paths are forbidden.' };
  }

  // Prevent invalid characters
  if (/[<>:"/\\|?*]/.test(filename)) {
    return { safePath: null, error: 'Filename contains forbidden filesystem characters.' };
  }

  const baseDir = getSafeBaseDirectory();
  const targetDir = subfolder ? path.join(baseDir, subfolder) : baseDir;

  const resolved = path.resolve(targetDir, filename);
  if (!resolved.startsWith(baseDir)) {
    return { safePath: null, error: 'Path escapes designated safe directory.' };
  }

  return { safePath: resolved };
}
