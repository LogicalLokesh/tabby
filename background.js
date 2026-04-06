// background.js — Tabby Service Worker
// Handles opening tabs in incognito mode (requires "allow in incognito" permission)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openTabs') {
    const { urls, incognito } = message;
    if (incognito) {
      chrome.windows.create({ url: urls, incognito: true }, (win) => {
        sendResponse({ success: true, windowId: win.id });
      });
    } else {
      chrome.windows.create({ url: urls }, (win) => {
        sendResponse({ success: true, windowId: win.id });
      });
    }
    return true; // keep message channel open for async response
  }
});
