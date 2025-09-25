import { WorkspaceManagerData } from "./types";

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
    try {
      const data = localStorage.getItem('workspaceManagerData');
      if (data) {
        resolve(JSON.parse(data));
      } else {
        resolve(getDefaultWorkspaceManagerData());
      }
    } catch (error) {
      console.error('Error getting data from localStorage:', error);
      resolve(getDefaultWorkspaceManagerData());
    }
  });
}


export function downloadCSV(rows: unknown[][], filename = 'data.csv') {
  const processRow = (row: unknown[]) => row.map(String).map(v => 
    v.replace(/"/g, '""')
  ).map(v => `"${v}"`).join(',');
  const csvContent = rows.map(processRow).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function decodeHtmlEntities(encodedString: string) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = encodedString;
  return textarea.value;
}
