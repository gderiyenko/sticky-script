// background.js - Service worker for Sticky Script extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECT_CODE') {
    const { css, js, domain } = message;
    const tabId = sender.tab.id;

    // Inject CSS if provided
    if (css && css.length > 0) {
      chrome.scripting.insertCSS({
        target: { tabId },
        css: css
      }).then(() => {
        console.log(`Sticky: Injected ${css.length} characters of CSS for ${domain}`);
      }).catch(err => {
        console.error('Sticky: Failed to inject CSS', err);
      });
    }

    // Inject JavaScript if provided - using world: MAIN to bypass CSP
    if (js && js.length > 0) {
      chrome.scripting.executeScript({
        target: { tabId },
        world: 'MAIN',
        func: (userCode, siteDomain) => {
          try {
            // Execute user code in main world (bypasses CSP)
            eval(userCode);
          } catch (e) {
            console.error(`Sticky JS Error on ${siteDomain}:`, e);
          }
        },
        args: [js, domain]
      }).then(() => {
        console.log(`Sticky: Injected ${js.length} characters of JavaScript for ${domain}`);
        sendResponse({ success: true });
      }).catch(err => {
        console.error('Sticky: Failed to inject JavaScript', err);
        sendResponse({ success: false, error: err.message });
      });
    } else {
      sendResponse({ success: true });
    }

    return true; // Keep message channel open for async response
  }
});
