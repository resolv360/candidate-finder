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

export interface WorkspaceManagerData {
  workspaces: Workspace[];
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

// Global window interface extensions
declare global {
  interface Window {
    leadGenManager?: any;
  }
}

