import { sanitizeText } from '../shared/security';

function getVisibleText(): string {
  try {
    const clone = document.body.cloneNode(true) as HTMLElement;
    // Strip script and style tags
    const toRemove = clone.querySelectorAll('script, style, noscript, svg, canvas');
    toRemove.forEach((el) => el.remove());
    return sanitizeText(clone.innerText || clone.textContent || '');
  } catch {
    return sanitizeText(document.body.innerText || '');
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.source !== 'karya-service-worker') {
    return;
  }

  const { type } = message;

  switch (type) {
    case 'GET_PAGE_TEXT': {
      const text = getVisibleText();
      sendResponse({
        text,
        title: document.title,
        url: window.location.href,
        length: text.length,
      });
      break;
    }

    case 'GET_SELECTED_TEXT': {
      const selection = window.getSelection()?.toString() || '';
      sendResponse({
        selectedText: selection,
        hasSelection: selection.length > 0,
      });
      break;
    }

    case 'SCROLL': {
      const direction = message.direction === 'up' ? -1 : 1;
      const scrollDistance = (typeof message.amount === 'number' && message.amount > 0)
        ? message.amount
        : window.innerHeight * 0.75;

      window.scrollBy({
        top: direction * scrollDistance,
        behavior: 'smooth',
      });

      sendResponse({
        direction: message.direction,
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
      });
      break;
    }

    case 'FIND_TEXT': {
      const searchText = typeof message.text === 'string' ? message.text.trim() : '';
      if (!searchText) {
        sendResponse({ found: false, count: 0 });
        break;
      }

      // Safe DOM text search without eval()
      const bodyText = (document.body.innerText || '').toLowerCase();
      const target = searchText.toLowerCase();
      const count = bodyText.split(target).length - 1;
      const found = count > 0;

      // Use standard window.find if available in chromium
      const winWithFind = window as unknown as { find?: (text: string, a?: boolean, b?: boolean, c?: boolean, d?: boolean, e?: boolean, f?: boolean) => boolean };
      if (found && typeof winWithFind.find === 'function') {
        winWithFind.find(searchText, false, false, true, false, false, false);
      }

      sendResponse({
        found,
        count,
        query: searchText,
      });
      break;
    }

    default:
      sendResponse({ error: `Unknown content script action: ${type}` });
      break;
  }

  return true;
});

console.log('[KARYA Extension] Content script attached to page.');
