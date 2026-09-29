# KARYA Windows Desktop Bridge

A secure, standalone Node.js + TypeScript service running on `127.0.0.1:48123` to provide genuine Windows operating system capabilities to the KARYA AI agent.

## Capabilities
- `desktop.open_application`: Launch approved Windows applications (Chrome, Notepad, Calculator, Explorer, Edge, Paint).
- `desktop.open_url`: Safely opens `http` / `https` URLs in the default Windows browser.
- `desktop.open_folder`: Safely opens verified folders (Desktop, Documents, Downloads, Pictures, Videos, Music) in File Explorer.
- `desktop.create_local_file`: Safely creates files in `Documents/Karya` with strict path traversal checks.
- `desktop.read_selected_file`: Uses Windows file picker dialog requiring explicit user file selection.
- `desktop.take_screenshot`: Captures primary display screenshot via Windows API and saves to temporary file.
- `desktop.get_system_info`: Inspects CPU, RAM, OS release, and uptime.

## Security Architecture
- Strictly binds only to `127.0.0.1` (never exposed to public network).
- Zero arbitrary command or shell execution (`cmd`, `powershell`, `bash`, `exec()` are forbidden).
- Strict one-time expiring pairing codes.
- Cryptographically generated authentication tokens checked on every command.
- Path traversal rejection.

## Setup & Running
1. Install dependencies:
   ```bash
   npm install
   ```
2. Build TypeScript:
   ```bash
   npm run build
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Observe the 6-character pairing code printed in the console:
   ```
   ====================================================
    KARYA Windows Desktop Bridge Server
    Running locally on: http://127.0.0.1:48123
    One-Time Pairing Code: >>> A1B2C3 <<<
   ====================================================
   ```
5. Open KARYA web application, go to **Settings → Desktop Bridge**, enter the code, and click **Pair Desktop Bridge**.
