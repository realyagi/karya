const ALLOWED_ACTIONS = new Set(['active_tab', 'open_url', 'create_tab', 'read_page', 'selected_text', 'scroll', 'find_text']);

function response(requestId, success, data, error) {
  return { source: 'karya-extension', requestId, success, data, error };
}

async function handle(message, sender) {
  if (message?.source !== 'karya-web' || !ALLOWED_ACTIONS.has(message.action)) return response(message?.requestId, false, null, 'Action is not allowed.');
  if (sender.origin && !sender.origin.startsWith('http://localhost:') && !sender.origin.startsWith('https://')) return response(message.requestId, false, null, 'Origin is not allowed.');
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (message.action === 'active_tab') return response(message.requestId, true, { id: tab?.id, title: tab?.title, url: tab?.url });
  if (message.action === 'open_url' || message.action === 'create_tab') {
    if (typeof message.url !== 'string' || !/^https?:\/\//i.test(message.url)) return response(message.requestId, false, null, 'Only http and https URLs are allowed.');
    const created = await chrome.tabs.create({ url: message.url, active: true });
    return response(message.requestId, true, { id: created.id, url: created.url });
  }
  if (!tab?.id) return response(message.requestId, false, null, 'No active tab is available.');
  const result = await chrome.tabs.sendMessage(tab.id, { ...message, source: 'karya-background' });
  return response(message.requestId, true, result);
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  handle(message, sender).then((result) => sendResponse(result)).catch((error) => sendResponse(response(message?.requestId, false, null, error instanceof Error ? error.message : 'Bridge request failed.')));
  return true;
});
