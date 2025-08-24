let clipboardText = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "setClipboardText") {
    clipboardText = message.text;
    sendResponse({ status: "text received" });
  }
});

// Listen for user click event on the page to trigger clipboard copy
window.addEventListener("click", () => {
  if (clipboardText) {
    navigator.clipboard.writeText(clipboardText).catch(console.error);
    clipboardText = ""; // clear after copy to avoid repeated writes
  }
});
