import { spawn } from 'child_process';

// Strictly allowlisted applications with binary mapping
const ALLOWLISTED_APPS: Record<string, string> = {
  chrome: 'chrome',
  googlechrome: 'chrome',
  notepad: 'notepad',
  calculator: 'calc',
  calc: 'calc',
  explorer: 'explorer',
  edge: 'msedge',
  msedge: 'msedge',
  wordpad: 'write',
  paint: 'mspaint',
  mspaint: 'mspaint',
};

export async function openApplication(appName: string): Promise<{ app: string; message: string }> {
  if (!appName || typeof appName !== 'string') {
    throw new Error('Application name is required.');
  }

  const normalized = appName.trim().toLowerCase().replace(/\.exe$/, '');
  const executable = ALLOWLISTED_APPS[normalized];

  if (!executable) {
    const supported = Object.keys(ALLOWLISTED_APPS).join(', ');
    throw new Error(
      `Application "${appName}" is not in the approved allowlist. Approved applications: ${supported}.`
    );
  }

  return new Promise((resolve, reject) => {
    // Spawn application detached from this process
    const child = spawn(executable, [], {
      detached: true,
      stdio: 'ignore',
      shell: false,
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to launch ${executable}: ${err.message}`));
    });

    // Unref so server does not hang waiting for application to close
    child.unref();

    resolve({
      app: executable,
      message: `Launched ${executable} successfully.`,
    });
  });
}
