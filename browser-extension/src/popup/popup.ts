document.addEventListener('DOMContentLoaded', async () => {
  const versionBadge = document.getElementById('versionBadge');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const activeTabInfo = document.getElementById('activeTabInfo');
  const browserAccessToggle = document.getElementById('browserAccessToggle') as HTMLInputElement | null;
  const openKaryaBtn = document.getElementById('openKaryaBtn');
  const settingsBtn = document.getElementById('settingsBtn');

  if (versionBadge) {
    versionBadge.textContent = `v${chrome.runtime.getManifest().version}`;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab && activeTabInfo) {
      activeTabInfo.textContent = tab.title || tab.url || 'No title';
      activeTabInfo.title = tab.url || '';
    }
  } catch {
    if (activeTabInfo) activeTabInfo.textContent = 'Active tab unavailable';
  }

  // Check saved access toggle
  chrome.storage.local.get(['karya_browser_access'], (result) => {
    const enabled = result.karya_browser_access !== false;
    if (browserAccessToggle) {
      browserAccessToggle.checked = enabled;
    }
  });

  browserAccessToggle?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    chrome.storage.local.set({ karya_browser_access: checked });
  });

  openKaryaBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });

  settingsBtn?.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      chrome.tabs.create({ url: chrome.runtime.getURL('src/options/options.html') });
    }
  });
});
