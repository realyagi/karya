"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.takeScreenshot = takeScreenshot;
const child_process_1 = require("child_process");
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
async function takeScreenshot() {
    return new Promise((resolve, reject) => {
        const tmpDir = os_1.default.tmpdir();
        const outputPath = path_1.default.join(tmpDir, `karya_screenshot_${Date.now()}.png`);
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
        const child = (0, child_process_1.spawn)('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript]);
        child.on('close', (code) => {
            if (code !== 0 || !fs_1.default.existsSync(outputPath)) {
                return reject(new Error('Failed to capture Windows screenshot.'));
            }
            try {
                const stats = fs_1.default.statSync(outputPath);
                // Read file for verification
                const buffer = fs_1.default.readFileSync(outputPath);
                const base64 = buffer.slice(0, 100000).toString('base64'); // partial thumbnail
                resolve({
                    path: outputPath,
                    size: stats.size,
                    base64Thumbnail: `data:image/png;base64,${base64}`,
                    message: `Screenshot captured successfully (${Math.round(stats.size / 1024)} KB) and saved to ${outputPath}.`,
                });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                reject(new Error(`Screenshot processing failed: ${msg}`));
            }
        });
        child.on('error', (err) => {
            reject(new Error(`Screenshot process launch error: ${err.message}`));
        });
    });
}
