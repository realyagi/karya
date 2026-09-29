import { validateUrl } from '../shared/security';
const STORAGE_KEY_AUTH = 'karya_auth_data';
function createResponse(requestId, success, data, error) {
    return {
        source: 'karya-extension',
        requestId,
        success,
        data,
        error,
    };
}
async function getAuthData() {
    return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY_AUTH], (result) => {
            resolve(result[STORAGE_KEY_AUTH] || null);
        });
    });
}
export async function handleCommand(command) {
    const untypedCommand = command;
    if (!command || typeof command !== 'object' || !command.type) {
        return createResponse(untypedCommand?.requestId || 'unknown', false, undefined, 'Invalid command structure.');
    }
    const { type, requestId } = command;
    try {
        switch (type) {
            case 'GET_ACTIVE_TAB': {
                const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                if (!activeTab) {
                    return createResponse(requestId, false, undefined, 'No active tab found.');
                }
                const tabInfo = {
                    id: activeTab.id,
                    title: activeTab.title || 'Untitled',
                    url: activeTab.url || '',
                    active: activeTab.active,
                };
                return createResponse(requestId, true, tabInfo);
            }
            case 'OPEN_URL': {
                const validation = validateUrl(command.url);
                if (!validation.valid) {
                    return createResponse(requestId, false, undefined, validation.error);
                }
                const tab = await chrome.tabs.create({ url: command.url, active: true });
                return createResponse(requestId, true, { tabId: tab.id, url: tab.url || command.url });
            }
            case 'CREATE_TAB': {
                if (command.url) {
                    const validation = validateUrl(command.url);
                    if (!validation.valid) {
                        return createResponse(requestId, false, undefined, validation.error);
                    }
                }
                const tab = await chrome.tabs.create({ url: command.url ? command.url : undefined, active: true });
                return createResponse(requestId, true, { tabId: tab.id, url: tab.url });
            }
            case 'GET_PAGE_TEXT':
            case 'GET_SELECTED_TEXT':
            case 'SCROLL':
            case 'FIND_TEXT': {
                let targetTabId = 'tabId' in command ? command.tabId : undefined;
                if (!targetTabId) {
                    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
                    if (!activeTab?.id) {
                        return createResponse(requestId, false, undefined, 'No active tab accessible.');
                    }
                    targetTabId = activeTab.id;
                }
                try {
                    const contentResponse = await chrome.tabs.sendMessage(targetTabId, {
                        ...command,
                        source: 'karya-service-worker',
                    });
                    return createResponse(requestId, true, contentResponse);
                }
                catch (csError) {
                    const msg = csError instanceof Error ? csError.message : String(csError);
                    return createResponse(requestId, false, undefined, `Content script communication failed: ${msg}. Try refreshing the target web page.`);
                }
            }
            default: {
                return createResponse(requestId, false, undefined, `Unsupported command type: ${command.type}`);
            }
        }
    }
    catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return createResponse(requestId, false, undefined, `Execution error: ${errorMsg}`);
    }
}
// Listen for messages from web application (external messaging)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    (async () => {
        const authData = await getAuthData();
        // Allow pairing requests or authenticated commands
        if (message?.type === 'PAIR') {
            const { authToken, karyaUrl, pairingCode } = message;
            if (!authToken || !pairingCode) {
                sendResponse(createResponse(message?.requestId || 'pair', false, undefined, 'Invalid pairing payload.'));
                return;
            }
            await chrome.storage.local.set({
                [STORAGE_KEY_AUTH]: { authToken, karyaUrl: karyaUrl || sender.origin, pairedAt: Date.now() },
            });
            sendResponse(createResponse(message?.requestId || 'pair', true, { paired: true }));
            return;
        }
        if (message?.type === 'CHECK_CONNECTION') {
            sendResponse(createResponse(message?.requestId || 'ping', true, {
                status: authData ? 'paired' : 'installed',
                version: chrome.runtime.getManifest().version,
            }));
            return;
        }
        // Authenticate command
        if (!authData || !authData.authToken) {
            sendResponse(createResponse(message?.requestId || 'auth', false, undefined, 'Extension is not paired with KARYA.'));
            return;
        }
        if (message.authToken !== authData.authToken) {
            sendResponse(createResponse(message?.requestId || 'auth', false, undefined, 'Invalid extension authentication token.'));
            return;
        }
        const result = await handleCommand(message);
        sendResponse(result);
    })();
    return true; // Keep asynchronous channel open
});
// Internal extension messages (popup / options)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'TEST_COMMAND') {
        handleCommand(message.command)
            .then((res) => sendResponse(res))
            .catch((err) => sendResponse(createResponse('test', false, undefined, err.message)));
        return true;
    }
    if (message?.type === 'GET_STATUS') {
        getAuthData().then((auth) => {
            sendResponse({ paired: Boolean(auth?.authToken), data: auth });
        });
        return true;
    }
    if (message?.type === 'DISCONNECT') {
        chrome.storage.local.remove([STORAGE_KEY_AUTH], () => {
            sendResponse({ success: true });
        });
        return true;
    }
    return false;
});
console.log('[KARYA Extension] Background Service Worker active.');
