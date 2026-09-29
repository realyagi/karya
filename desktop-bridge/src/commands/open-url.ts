import { spawn } from 'child_process';
import { validateSafeUrl } from '../security';

export async function openUrl(url: string): Promise<{ url: string; message: string }> {
  const validation = validateSafeUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid or unsafe URL.');
  }

  return new Promise((resolve, reject) => {
    // On Windows, 'explorer <url>' or 'start <url>' launches default browser safely
    const child = spawn('cmd.exe', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to open URL in browser: ${err.message}`));
    });

    child.unref();

    resolve({
      url,
      message: `Opened ${url} in default browser.`,
    });
  });
}
