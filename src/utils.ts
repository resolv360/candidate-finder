import { Profile, WorkspaceManagerData } from "./webpage/types";

export function getDefaultWorkspaceManagerData(): WorkspaceManagerData {
  return {
    workspaces: [],
    settings: {
      GOOGLE_CUSTOM_SEARCH_API_KEY: "",
      GOOGLE_CUSTOM_SEARCH_ID: "",
      GEMINI_API_KEY: "",
    },
    currentWorkspaceId: null,
  };
}

export function fetchWorkspaceData(): Promise<WorkspaceManagerData> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["workspaceManagerData"], (result) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error getting data from chrome.storage:",
          chrome.runtime.lastError
        );
        resolve(getDefaultWorkspaceManagerData());
        return;
      }

      resolve(
        result.workspaceManagerData
          ? result.workspaceManagerData
          : getDefaultWorkspaceManagerData()
      );
    });
  });
}


export function parseTemplate(template: string, candidate: Profile): string {
  return template
    .replace(/\[Name\]/g, candidate.name)
    .replace(/\[Job Title\]/g, candidate.jobTitle);
}
