// AuditIQ Extension Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('AuditIQ extension installed');
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_API_KEY') {
    chrome.storage.local.get('apiKey', (data) => {
      sendResponse({ apiKey: data.apiKey || null });
    });
    return true;
  }
});
