export interface Profile extends Candidate {
  checked: boolean;
}

export interface Workspace {
  id: number;
  title: string;
  jobDescription: string;
  candidateCount: number;
  queryCount: number;
  profiles: Profile[];
  template: string;
}

export interface Settings {
  GOOGLE_CUSTOM_SEARCH_API_KEY: string;
  GOOGLE_CUSTOM_SEARCH_ID: string;
  GEMINI_API_KEY: string;
}

export interface WorkspaceManagerData {
  workspaces: Workspace[];
  settings: Settings;
  currentWorkspaceId: number | null;
}

export interface ModalHandlers {
  close?: () => void;
  cancel?: () => void;
  submit?: (e: Event) => void;
}

export interface Candidate {
  name: string;
  jobTitle: string;
  pageTitle: string;
  link: string;
}

