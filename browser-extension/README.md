# KARYA Browser Extension (Manifest V3)

The official Chrome/Chromium extension for KARYA, allowing voice-driven browser actions:
- Query active tab info
- Open safe URLs
- Create tabs
- Read visible page text
- Read user selection
- Scroll pages
- Search page text

## Permissions Explained
- `activeTab`: Provides safe access to the current focused tab when the user interacts or executes a voice command, without requiring broad browsing history access.
- `tabs`: Enables reading tab status (title, URL) and opening new tabs.
- `storage`: Securely stores the authenticated pairing credential received from KARYA.
- `host_permissions` (`http://localhost:3000/*`): Allows communication exclusively with the local KARYA web application. We explicitly avoid `<all_urls>` permission to follow the principle of least privilege.

## Building the Extension
```bash
cd browser-extension
npm run build
```
This compiles TypeScript files in `src/` to `.js` files in `dist/`.

## Loading in Chrome / Edge / Brave
1. Open Chrome and navigate to `chrome://extensions`.
2. Turn on **Developer mode** (toggle in upper right corner).
3. Click **Load unpacked**.
4. Select the `karya/browser-extension` folder.
5. In KARYA web app, go to **Settings → Integrations → Browser Extension**.
6. Generate a pairing code, open extension Options/Popup, enter code, and click **Pair Extension**.
