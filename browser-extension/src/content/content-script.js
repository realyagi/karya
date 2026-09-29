import { sanitizeText } from '../shared/security';
function getVisibleText() {
    try {
        const clone = document.body.cloneNode(true);
        // Strip script and style tags
        const toRemove = clone.querySelectorAll('script, style, noscript, svg, canvas');
        toRemove.forEach((el) => el.remove());
        return sanitizeText(clone.innerText || clone.textContent || '');
    }
    catch {
        return sanitizeText(document.body.innerText || '');
    }
}
function showKaryaIndicator(actionName) {
    try {
        let indicator = document.getElementById('karya-cursor-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'karya-cursor-indicator';
            indicator.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:999999;background:rgba(139,92,246,0.95);color:#ffffff;padding:8px 16px;border-radius:20px;font-family:sans-serif;font-size:12px;font-weight:600;box-shadow:0 0 20px rgba(139,92,246,0.5);border:1px solid rgba(255,255,255,0.2);pointer-events:none;transition:opacity 0.3s ease;display:flex;align-items:center;gap:8px;';
            document.body.appendChild(indicator);
        }
        indicator.innerHTML = `<span style="width:8px;height:8px;border-radius:50%;background:#22d3ee;display:inline-block;animation:pulse 1s infinite;"></span> KARYA: ${actionName}`;
        indicator.style.opacity = '1';
        setTimeout(() => {
            if (indicator) indicator.style.opacity = '0';
        }, 3000);
    } catch (e) {
        // Fallback quiet
    }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || message.source !== 'karya-service-worker') {
        return;
    }
    const { type } = message;
    showKaryaIndicator(type.replace(/_/g, ' '));
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
            const winWithFind = window;
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
