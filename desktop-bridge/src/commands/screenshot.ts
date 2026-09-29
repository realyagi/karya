import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';

export async function takeScreenshot(): Promise<{
  path: string;
  size: number;
  base64Thumbnail?: string;
  message: string;
}> {
  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const outputPath = path.join(tmpDir, `karya_screenshot_${Date.now()}.png`);

    // Use .NET Graphics to capture screen on Windows cleanly without native binary deps
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
      $graphics = [System.Drawing.Graphics]::FromImage($bmp)
      $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
      $bmp.Save("${outputPath.replace(/\\/g, '\\\\')}", [System.Drawing.Imaging.ImageFormat]::Png)
      $graphics.Dispose()
      $bmp.Dispose()
    `;

    const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript]);

    child.on('close', (code) => {
      if (code !== 0 || !fs.existsSync(outputPath)) {
        return reject(new Error('Failed to capture Windows screenshot.'));
      }

      try {
        const stats = fs.statSync(outputPath);
        // Read file for verification
        const buffer = fs.readFileSync(outputPath);
        const base64 = buffer.slice(0, 100000).toString('base64'); // partial thumbnail

        resolve({
          path: outputPath,
          size: stats.size,
          base64Thumbnail: `data:image/png;base64,${base64}`,
          message: `Screenshot captured successfully (${Math.round(stats.size / 1024)} KB) and saved to ${outputPath}.`,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        reject(new Error(`Screenshot processing failed: ${msg}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Screenshot process launch error: ${err.message}`));
    });
  });
}
