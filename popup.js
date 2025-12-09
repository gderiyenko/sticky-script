let cssInput;
let jsInput;
let saveButton;
let statusMessage;
let currentUrlDisplay;

let currentKey = null;
let currentTabId = null; // New variable to store the active tab's ID

/**
 * Safely retrieves the key (URL domain) and tabId for the current tab.
 * @returns {Promise < { domain: string | null, tabId: number | null } >} The storage key and tab ID.
 */
async function getStorageKey() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.id) {
      currentUrlDisplay.textContent = "Error: Cannot determine tab.";
      return { domain: null, tabId: null };
    }

    let domain;
    let displayText;

    // Handle various URL scenarios
    if (!tab.url || tab.url === "" || tab.url === "about:blank") {
      domain = "__blank__";
      displayText = "Targeting: Blank Pages";
    } else if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://") ||
      tab.url.startsWith("about:")
    ) {
      currentUrlDisplay.textContent = "Cannot inject into internal pages.";
      return { domain: null, tabId: null };
    } else {
      const url = new URL(tab.url);
      domain = url.hostname;
      displayText = `Targeting: ${domain}`;
    }

    const tabId = tab.id;
    currentUrlDisplay.textContent = displayText;
    return { domain, tabId };
  } catch (error) {
    console.error("Error retrieving tab URL:", error);
    currentUrlDisplay.textContent = "Error: Cannot access current URL.";
    return { domain: null, tabId: null };
  }
}

/**
 * Loads saved code from storage and populates the text areas.
 */
async function loadContent() {
  const keyData = await getStorageKey();
  currentKey = keyData.domain;
  currentTabId = keyData.tabId; // Store the tab ID
  if (!currentKey) return;

  try {
    // Use chrome.storage.local
    const result = await chrome.storage.local.get([currentKey]);
    const savedData = result[currentKey] || { css: "", js: "" };

    cssInput.value = savedData.css || "";
    jsInput.value = savedData.js || "";
  } catch (error) {
    console.error("Error loading content:", error);
  }
}

/**
 * Saves the current content of the text areas to storage and applies it to the active tab.
 */
async function saveContent() {
  // Check for both the key (domain) and the tab ID
  if (!currentKey || !currentTabId) return;

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  const dataToSave = {
    css: cssInput.value.trim(),
    js: jsInput.value.trim(),
  };

  try {
    console.log("Saving data for key:", currentKey, dataToSave);

    // 1. Save the content to local storage
    await chrome.storage.local.set({ [currentKey]: dataToSave });

    // 2. Immediately execute the content.js script on the active tab
    // This forces the site to re-read the newly saved code and apply it instantly.
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      files: ["content.js"],
    });

    // Display success message
    statusMessage.textContent = "Saved and Applied!";
    statusMessage.style.opacity = "1";

    // Temporarily hide and show the message
    setTimeout(() => {
      statusMessage.style.opacity = "0";
    }, 2000);
  } catch (error) {
    console.error("Error saving or applying content:", error);
    statusMessage.textContent = "Error saving.";
    statusMessage.style.opacity = "1";
  } finally {
    saveButton.textContent = "Save & Apply to Site";
    saveButton.disabled = false;
  }
}

// Initialize the popup when the DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Assign elements after DOM is loaded
  cssInput = document.getElementById("cssInput");
  jsInput = document.getElementById("jsInput");
  saveButton = document.getElementById("saveButton");
  statusMessage = document.getElementById("statusMessage");
  currentUrlDisplay = document.getElementById("currentUrlDisplay");

  console.log("Popup DOM fully loaded.");

  loadContent();
  // Attach event listener to the save button
  saveButton.addEventListener("click", saveContent);

  // Handle tab key to insert 4 spaces instead of moving focus
  const codeEditor = document.querySelector(".code-editor");
  if (codeEditor) {
    codeEditor.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();

        const start = this.selectionStart;
        const end = this.selectionEnd;
        const spaces = "    "; // 4 spaces

        // Insert spaces at cursor position
        this.value =
          this.value.substring(0, start) + spaces + this.value.substring(end);

        // Move cursor after the inserted spaces
        this.selectionStart = this.selectionEnd = start + spaces.length;
      }
    });
  }
});
