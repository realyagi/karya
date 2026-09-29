"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const karyaUrlInput = document.getElementById('karyaUrlInput');
    const pairingCodeInput = document.getElementById('pairingCodeInput');
    const pairBtn = document.getElementById('pairBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const statusNotice = document.getElementById('statusNotice');
    function showMessage(text, isError = false) {
        statusNotice.textContent = text;
        statusNotice.className = `status-msg ${isError ? 'status-error' : 'status-success'}`;
    }
    // Load existing configuration
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
        if (res?.data?.karyaUrl) {
            karyaUrlInput.value = res.data.karyaUrl;
        }
        if (res?.paired) {
            showMessage(`Extension is actively paired with KARYA (${res.data.karyaUrl}).`);
        }
    });
    pairBtn.addEventListener('click', async () => {
        const rawUrl = karyaUrlInput.value.trim().replace(/\/$/, '');
        const code = pairingCodeInput.value.trim();
        if (!rawUrl) {
            showMessage('Please provide the KARYA application URL.', true);
            return;
        }
        if (!code) {
            showMessage('Please enter the pairing code from KARYA Settings.', true);
            return;
        }
        showMessage('Exchanging pairing code with KARYA...');
        try {
            // 1. Send pairing exchange request to KARYA backend
            const response = await fetch(`${rawUrl}/api/integrations/browser/pair`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pairingCode: code }),
            });
            const data = await response.json();
            if (!response.ok || !data.success || !data.authToken) {
                throw new Error(data.error || 'Failed to validate pairing code.');
            }
            // 2. Save auth token into extension storage
            await chrome.storage.local.set({
                karya_auth_data: {
                    authToken: data.authToken,
                    karyaUrl: rawUrl,
                    pairedAt: Date.now(),
                },
            });
            showMessage('Successfully paired with KARYA! You can now use browser voice commands.');
            pairingCodeInput.value = '';
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            showMessage(`Pairing failed: ${msg}`, true);
        }
    });
    disconnectBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'DISCONNECT' }, () => {
            showMessage('Disconnected from KARYA.', false);
        });
    });
});
