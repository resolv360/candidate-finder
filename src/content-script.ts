let clipboardText = "";

// Frontend version - no Chrome APIs needed
// This function can be called directly from the React app
export const setClipboardText = (text: string) => {
  clipboardText = text;
};

// Listen for user click event on the page to trigger clipboard copy
window.addEventListener("click", () => {
  if (clipboardText) {
    navigator.clipboard.writeText(clipboardText).catch(console.error);
    clipboardText = ""; // clear after copy to avoid repeated writes
  }
});

// Export for use in React components
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};
