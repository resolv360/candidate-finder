import { WorkspaceManagerData } from "./types";
import { WorkspaceStorage } from "./workspace-storage";

export function getDefaultWorkspaceManagerData(): WorkspaceManagerData {
  return {
    workspaces: [],
    currentWorkspaceId: null,
  };
}

export async function fetchWorkspaceData(): Promise<WorkspaceManagerData> {
  try {
    const workspaces = await WorkspaceStorage.loadAllWorkspaces();
    const currentWorkspaceId = await WorkspaceStorage.getCurrentWorkspaceId();
    
    console.log('Loaded workspace data:', {
      workspaces: workspaces.length,
      currentWorkspaceId
    });
    
    return {
      workspaces,
      currentWorkspaceId
    };
  } catch (error) {
    console.error('Error fetching workspace data:', error);
    return getDefaultWorkspaceManagerData();
  }
}

// Environment variable accessors
export function getApiKeys() {
  return {
    GOOGLE_CUSTOM_SEARCH_API_KEY: import.meta.env.VITE_GOOGLE_CUSTOM_SEARCH_API_KEY || '',
    GOOGLE_CUSTOM_SEARCH_ID: import.meta.env.VITE_GOOGLE_CUSTOM_SEARCH_ID || '',
    GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || ''
  };
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
