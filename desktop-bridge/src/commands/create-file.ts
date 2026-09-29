import fs from 'fs';
import path from 'path';
import { validateFilePath } from '../security';

export async function createLocalFile(
  filename: string,
  content: string,
  subfolder?: string
): Promise<{ filename: string; path: string; size: number; message: string }> {
  const validation = validateFilePath(filename, subfolder);
  if (!validation.safePath) {
    throw new Error(validation.error || 'Invalid file target path.');
  }

  const targetPath = validation.safePath;
  const targetDir = path.dirname(targetPath);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetPath, content || '', 'utf8');
  const stat = fs.statSync(targetPath);

  return {
    filename,
    path: targetPath,
    size: stat.size,
    message: `File "${filename}" created successfully at ${targetPath}.`,
  };
}
