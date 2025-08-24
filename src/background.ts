import { fetchWorkspaceData, parseTemplate } from "./utils";

// When extension icon is clicked, open html in a new tab
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/webpage/index.html") });
});
console.log("Extension started!");

// Listen to active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  console.log("Tab activated");
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    console.log("Active tab:", tab.url);

    if (
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      console.warn("Unsupported tab URL:", tab.url);
      return;
    }

    const data = await fetchWorkspaceData();
    if (data.currentWorkspaceId === null) {
      console.warn("No current workspace");
      return;
    }

    const currentWorkspace = data.workspaces.find(
      (w) => w.id === data.currentWorkspaceId
    );
    if (!currentWorkspace) {
      console.warn("No current workspace found");
      return;
    }

    const tabUrl = new URL(tab.url);

    const candidate = currentWorkspace.profiles.find((p) => {
      const linkUrl = new URL(p.link);

      return (
        linkUrl.host.match(/\w+\.linkedin\.com/) &&
        linkUrl.pathname.replace(/\/$/, "") ===
          tabUrl.pathname.replace(/\/$/, "")
      );
    });
    if (!candidate) {
      console.warn("No matching candidate found");
      return;
    }

    const valueToCopy = parseTemplate(currentWorkspace.template, candidate);
    console.log("Value to copy:", valueToCopy);

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id! },
        files: ["dist/content-script.js"],
      },
      () => {
        console.log("Script injected successfully");

        if (chrome.runtime.lastError) {
          console.error(
            "Script injection failed:",
            chrome.runtime.lastError.message
          );
          return;
        }
        chrome.tabs.sendMessage(
          tab.id!,
          { type: "setClipboardText", text: valueToCopy },
          (response) => {
            if (chrome.runtime.lastError) {
              console.warn(
                "Message sending failed:",
                chrome.runtime.lastError.message
              );
            }
          }
        );
      }
    );
  } catch (error) {
    console.error(error);
  }
});
