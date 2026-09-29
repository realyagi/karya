import { spawn } from 'child_process';
import fs from 'fs';

export async function readSelectedFile(): Promise<{
  filename: string;
  path: string;
  size: number;
  content: string;
  message: string;
}> {
  return new Promise((resolve, reject) => {
    // Invoke Windows PowerShell file dialog for user-explicit consent
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      $f = New-Object System.Windows.Forms.OpenFileDialog
      $f.Title = "Select a file for KARYA"
      $f.Filter = "All Files (*.*)|*.*|Text Files (*.txt)|*.txt|Markdown (*.md)|*.md|JSON (*.json)|*.json"
      $res = $f.ShowDialog()
      if ($res -eq [System.Windows.Forms.DialogResult]::OK) {
        Write-Output $f.FileName
      }
    `;

    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript]);

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (d) => {
      output += d.toString();
    });

    child.stderr.on('data', (d) => {
      errorOutput += d.toString();
    });

    child.on('close', (code) => {
      const selectedPath = output.trim();
      if (!selectedPath) {
        return reject(new Error('No file was selected by the user.'));
      }

      if (!fs.existsSync(selectedPath)) {
        return reject(new Error('Selected file could not be found.'));
      }

      try {
        const stats = fs.statSync(selectedPath);
        if (stats.size > 2 * 1024 * 1024) {
          // Limit to 2MB for safe text reading
          return reject(new Error('File exceeds maximum readable size limit of 2MB.'));
        }

        const content = fs.readFileSync(selectedPath, 'utf8');
        const filename = selectedPath.split(/[\\/]/).pop() || 'selected-file';

        resolve({
          filename,
          path: selectedPath,
          size: stats.size,
          content: content.slice(0, 10000), // First 10k chars
          message: `Read file "${filename}" (${stats.size} bytes).`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        reject(new Error(`Failed to read file: ${msg}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to prompt file picker: ${err.message}`));
    });
  });
}
