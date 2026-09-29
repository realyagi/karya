function visibleText() {
  return document.body?.innerText?.slice(0, 20000) || '';
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'read_page') sendResponse({ text: visibleText(), title: document.title, url: location.href });
  else if (message.action === 'selected_text') sendResponse({ text: window.getSelection()?.toString() || '' });
  else if (message.action === 'scroll') { window.scrollBy({ top: Number(message.amount) || window.innerHeight, behavior: 'smooth' }); sendResponse({ scrollY: window.scrollY }); }
  else if (message.action === 'find_text') sendResponse({ found: visibleText().toLowerCase().includes(String(message.text || '').toLowerCase()) });
  return true;
});
