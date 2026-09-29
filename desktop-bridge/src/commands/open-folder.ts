import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

const APPROVED_FOLDERS: Record<string, () => string> = {
  desktop: () => path.join(os.homedir(), 'Desktop'),
  documents: () => path.join(os.homedir(), 'Documents'),
  downloads: () => path.join(os.homedir(), 'Downloads'),
  pictures: () => path.join(os.homedir(), 'Pictures'),
  music: () => path.join(os.homedir(), 'Music'),
  videos: () => path.join(os.homedir(), 'Videos'),
};

export async function openFolder(folderName: string): Promise<{ folder: string; path: string; message: string }> {
  if (!folderName || typeof folderName !== 'string') {
    throw new Error('Folder name is required.');
  }

  const normalized = folderName.trim().toLowerCase();
  const resolver = APPROVED_FOLDERS[normalized];

  if (!resolver) {
    const supported = Object.keys(APPROVED_FOLDERS).join(', ');
    throw new Error(
      `Folder "${folderName}" is not an approved safe folder. Approved folders: ${supported}.`
    );
  }

  const resolvedPath = resolver();

  return new Promise((resolve, reject) => {
    const child = spawn('explorer.exe', [resolvedPath], {
      detached: true,
      stdio: 'ignore',
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to open folder ${folderName}: ${err.message}`));
    });

    child.unref();

    resolve({
      folder: normalized,
      path: resolvedPath,
      message: `Opened ${folderName} folder in File Explorer.`,
    });
  });
}
