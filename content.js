// content.js - Sticky Code Injector

(async () => {
  // 1. Determine the storage key (current domain or special identifier)
  let domain = window.location.hostname;

  // Handle blank/empty pages
  if (!domain || domain === "") {
    domain = "__blank__";
  }

  // 2. Fetch the stored data for this domain
  try {
    const result = await chrome.storage.local.get([domain]);
    const savedData = result[domain];

    if (!savedData) {
      // No custom code saved for this domain
      return;
    }

    const { css, js } = savedData;

    // 3. Send code to background script for injection
    // The background script uses chrome.scripting API with world: MAIN to bypass CSP
    if (css || js) {
      chrome.runtime.sendMessage(
        {
          type: "INJECT_CODE",
          css: css || "",
          js: js || "",
          domain: domain,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Sticky: Failed to communicate with background script",
              chrome.runtime.lastError,
            );
          } else if (response && response.success) {
            console.log(`Sticky: Successfully injected code for ${domain}`);
          } else {
            console.error("Sticky: Injection failed", response?.error);
          }
        },
      );
    }
  } catch (error) {
    console.error("Sticky: Failed to retrieve or inject code.", error);
  }
})();
