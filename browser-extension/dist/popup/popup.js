"use strict";
document.addEventListener('DOMContentLoaded', async () => {
    const versionBadge = document.getElementById('versionBadge');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const activeTabInfo = document.getElementById('activeTabInfo');
    const testBtn = document.getElementById('testConnectionBtn');
    const reconnectBtn = document.getElementById('reconnectBtn');
    const resultBox = document.getElementById('resultBox');
    versionBadge.textContent = `v${chrome.runtime.getManifest().version}`;
    async function updateActiveTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
            if (tab) {
                activeTabInfo.textContent = tab.title || tab.url || 'No title';
                activeTabInfo.title = tab.url || '';
            }
            else {
                activeTabInfo.textContent = 'None detected';
            }
        }
        catch (e) {
            activeTabInfo.textContent = 'Unable to query tab';
        }
    }
    async function checkStatus() {
        chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
            if (chrome.runtime.lastError) {
                statusDot.className = 'dot disconnected';
                statusText.textContent = 'Service Worker Offline';
                statusText.style.color = '#f87171';
                return;
            }
            if (res?.paired) {
                statusDot.className = 'dot connected';
                statusText.textContent = 'Connected';
                statusText.style.color = '#34d399';
            }
            else {
                statusDot.className = 'dot disconnected';
                statusText.textContent = 'Disconnected';
                statusText.style.color = '#f87171';
            }
        });
    }
    await updateActiveTab();
    await checkStatus();
    testBtn.addEventListener('click', () => {
        resultBox.style.display = 'block';
        resultBox.textContent = 'Running test: GET_ACTIVE_TAB...';
        chrome.runtime.sendMessage({
            type: 'TEST_COMMAND',
            command: {
                type: 'GET_ACTIVE_TAB',
                requestId: `popup-test-${Date.now()}`,
            },
        }, (response) => {
            if (chrome.runtime.lastError) {
                resultBox.textContent = `Test Error: ${chrome.runtime.lastError.message}`;
            }
            else {
                resultBox.textContent = `Response: ${JSON.stringify(response, null, 2)}`;
            }
        });
    });
    reconnectBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage?.() || window.open(chrome.runtime.getURL('src/options/options.html'));
    });
});
