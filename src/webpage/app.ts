import {
  ModalHandlers,
  Profile,
  Workspace,
  WorkspaceManagerData,
} from "./types";
import { decodeHtmlEntities, downloadCSV, fetchWorkspaceData, getDefaultWorkspaceManagerData } from "./utils";

import { LLM } from "./llm";
import { LeadGenManager } from "./leadgen";
import { searchCandidates } from "./candidate-search";

let tempNewWorkspaceData: Partial<Workspace> | null = null;

class WorkspaceManager {
  data: WorkspaceManagerData = getDefaultWorkspaceManagerData();
  private nextWorkspaceId: number;
  private nextProfileId: number;
  private pendingWorkspaceData: Workspace | null;
  private pendingSearchQuery: string[] | null = null;

  constructor() {
    this.withLoading(this.fetchFromLocalStorage.bind(this)).then((data) => {
      this.data = data;
      this.init();
    });
    this.nextWorkspaceId = 3;
    this.nextProfileId = 9;
    this.pendingWorkspaceData = null;
  }

  saveToLocalStorage(): void {
    chrome.storage.local.set({ workspaceManagerData: this.data }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving to chrome.storage:",
          chrome.runtime.lastError
        );
      } else {
        console.log("Data successfully saved to chrome.storage");
      }
    });
  }

  fetchFromLocalStorage(): Promise<WorkspaceManagerData> {
    return fetchWorkspaceData();
  }

  init(): void {
    console.log("Initializing WorkspaceManager...");
    this.bindStaticEvents();
    this.bindTabEvents();
    this.renderWorkspaceList();
    console.log("WorkspaceManager initialized successfully");
  }

  private openNext5Workspaces(): void {
    console.log("Opening next 5 workspaces...");
    const workspace = this.getWorkspaceById(this.data.currentWorkspaceId);
    if (!workspace) return;

    const candidates = workspace.profiles
      .filter((profile) => !profile.checked)
      .slice(0, 5);

    candidates.forEach((profile) => {
      window.open(profile.link, "_blank", "noopener");
      this.handleProfileLinkClick(new MouseEvent("click"), profile.link);
    });
  }

  private downloadCSV() {
    const workspace = this.getWorkspaceById(this.data.currentWorkspaceId);
    if (!workspace) return;

    const data = workspace.profiles.map((profile) => [
      profile.name,
      decodeHtmlEntities(profile.jobTitle),
      profile.link,
    ]);

    const workspaceTitle = workspace.title.replace(/[^a-zA-Z0-9_]/g, "_");
    downloadCSV([["Name", "Job Title", "Link"], ...data], `${workspace.id}_${workspaceTitle}.csv`)
    console.log("CSV downloaded successfully");
  }

  private bindStaticEvents(): void {
    const createBtn = document.getElementById(
      "createWorkspaceBtn"
    ) as HTMLButtonElement | null;
    if (createBtn) {
      createBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Create workspace button clicked");
        this.openCreateWorkspaceModal();
      };
    }

    const openNext5Btn = document.getElementById(
      "openNext5Btn"
    ) as HTMLButtonElement | null;
    if (openNext5Btn) {
      openNext5Btn.onclick = (e) => {
        console.log("Open next 5 button clicked");
        this.openNext5Workspaces();
      };
    }

    const downloadCSVBtn = document.getElementById(
      "downloadCsvBtn"
    ) as HTMLButtonElement | null;
    if (downloadCSVBtn) {
      downloadCSVBtn.onclick = (e) => {
        console.log("Download CSV button clicked");
        this.downloadCSV();
      };
    }

    const settingsBtn = document.getElementById(
      "settingsBtn"
    ) as HTMLButtonElement | null;
    if (settingsBtn) {
      settingsBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Settings button clicked");
        this.openSettingsModal();
      };
    }

    this.bindModalEvents("createWorkspace", {
      close: () => this.closeCreateWorkspaceModal(),
      cancel: () => this.closeCreateWorkspaceModal(),
      submit: (e) => this.handleCreateWorkspace(e),
    });

    this.bindModalEvents("preview", {
      close: () => this.closePreviewModal(),
      cancel: () => this.closePreviewModal(),
      submit: (e) => this.handlePreviewSubmit(e),
    });

    this.bindModalEvents("settings", {
      close: () => this.closeSettingsModal(),
      cancel: () => this.closeSettingsModal(),
      submit: (e) => this.handleSettingsSubmit(e),
    });

    const templateTextarea = document.getElementById(
      "templateTextarea"
    ) as HTMLTextAreaElement | null;
    if (templateTextarea) {
      templateTextarea.addEventListener("change", (e) =>
        this.handleTemplateChange(e as InputEvent)
      );
    }
  }

  private bindModalEvents(modalName: string, handlers: ModalHandlers): void {
    const closeBtn = document.getElementById(
      `${modalName}Close`
    ) as HTMLButtonElement | null;
    const backdrop = document.getElementById(
      `${modalName}Backdrop`
    ) as HTMLElement | null;
    const cancelBtn = document.getElementById(
      `cancel${modalName.charAt(0).toUpperCase() + modalName.slice(1)}`
    ) as HTMLButtonElement | null;
    const form = document.getElementById(
      `${modalName}Form`
    ) as HTMLFormElement | null;

    if (closeBtn && handlers.close) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        handlers.close!();
      };
    }

    if (backdrop && handlers.close) {
      backdrop.onclick = (e) => {
        e.preventDefault();
        handlers.close!();
      };
    }

    if (cancelBtn && handlers.cancel) {
      cancelBtn.onclick = (e) => {
        e.preventDefault();
        handlers.cancel!();
      };
    }

    if (form && handlers.submit) {
      form.onsubmit = handlers.submit!;
    }
  }

  private bindTabEvents(): void {
    // Sidebar navigation
    const navTabs = document.querySelectorAll('.nav-tab');
    const navContents = document.querySelectorAll('.nav-content');
    const contentViews = document.querySelectorAll('.content-view');

    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        const viewName = target.getAttribute('data-view');
        
        if (!viewName) return;

        // Remove active class from all nav tabs and contents
        navTabs.forEach(btn => btn.classList.remove('active'));
        navContents.forEach(content => content.classList.remove('active'));
        contentViews.forEach(view => view.classList.remove('active'));

        // Add active class to clicked tab and corresponding content
        target.classList.add('active');
        
        // Show corresponding sidebar content
        const targetNavContent = document.getElementById(`${viewName}Section`);
        if (targetNavContent) {
          targetNavContent.classList.add('active');
        }

        // Show corresponding main content view
        if (viewName === 'workspaces') {
          // Show workspaces view
          const currentWorkspace = this.getWorkspaceById(this.data.currentWorkspaceId);
          if (currentWorkspace) {
            document.getElementById('workspaceContent')?.classList.add('active');
          } else {
            document.getElementById('workspaceView')?.classList.add('active');
          }
        } else if (viewName === 'leadgen') {
          // Show lead generation view and initialize manager
          document.getElementById('leadgenView')?.classList.add('active');
          if (!window.leadGenManager) {
            window.leadGenManager = new LeadGenManager();
          }
        }
      });
    });
  }

  // ---------- Workspace Management ----------
  private renderWorkspaceList(): void {
    const workspaceList = document.getElementById("workspaceList");
    if (!workspaceList) {
      console.error("Workspace list element not found");
      return;
    }

    workspaceList.innerHTML = "";

    this.data.workspaces.forEach((workspace, index) => {
      const workspaceItem = document.createElement("button");
      workspaceItem.className = "workspace-item";
      workspaceItem.textContent = `#${index + 1} ${workspace.title}`;
      workspaceItem.type = "button";

      workspaceItem.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log(
          `Switching to workspace: ${workspace.title} (ID: ${workspace.id})`
        );
        this.switchToWorkspace(workspace.id);
      };

      if (workspace.id === this.data.currentWorkspaceId) {
        workspaceItem.classList.add("active");
      }

      workspaceList.appendChild(workspaceItem);
    });

    console.log(`Rendered ${this.data.workspaces.length} workspaces`);
  }

  private switchToWorkspace(workspaceId: number): void {
    console.log(`Switching to workspace ID: ${workspaceId}`);

    const workspaceContent = document.getElementById("workspaceContent");
    const workspaceView = document.getElementById("workspaceView");

    if (!workspaceContent || !workspaceView) {
      console.error("Workspace content elements not found");
      return;
    }

    const workspace = this.getWorkspaceById(workspaceId);
    if (!workspace) {
      console.error(`Workspace with ID ${workspaceId} not found`);
      return;
    }

    this.data.currentWorkspaceId = workspaceId;

    // Hide all content views
    document.querySelectorAll('.content-view').forEach(view => view.classList.remove('active'));
    
    // Show workspace content
    workspaceContent.classList.add('active');

    this.renderWorkspaceList();
    this.renderProfiles(workspace);
    this.renderTemplate(workspace);

    this.saveToLocalStorage();

    console.log(`Successfully switched to workspace: ${workspace.title}`);
  }

  private renderProfiles(workspace: Workspace): void {
    const profilesList = document.getElementById("profilesList");
    const profileCount = document.getElementById("profileCount");

    if (!profilesList || !profileCount) {
      console.error("Profile elements not found");
      return;
    }

    profilesList.innerHTML = "";
    profileCount.textContent = `${workspace.profiles.length} profiles`;

    workspace.profiles.forEach((profile) => {
      const profileItem = document.createElement("div");
      profileItem.className = `profile-item ${
        profile.checked ? "checked" : ""
      }`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "profile-checkbox";
      checkbox.checked = profile.checked;
      checkbox.dataset.profileId = profile.link.toString();
      checkbox.onchange = (e) =>
        this.handleProfileCheckboxChange(e as Event, profile.link);

      const link = document.createElement("a");
      link.href = profile.link;
      link.className = "profile-link";
      link.target = "_blank";
      link.textContent = profile.name;
      link.onclick = (e) =>
        this.handleProfileLinkClick(e as MouseEvent, profile.link);

      profileItem.appendChild(checkbox);
      profileItem.appendChild(link);
      profilesList.appendChild(profileItem);
    });

    console.log(
      `Rendered ${workspace.profiles.length} profiles for workspace: ${workspace.title}`
    );
  }

  private renderTemplate(workspace: Workspace): void {
    const templateTextarea = document.getElementById(
      "templateTextarea"
    ) as HTMLTextAreaElement | null;
    if (!templateTextarea) {
      console.error("Template textarea not found");
      return;
    }

    templateTextarea.value = workspace.template || "";
    console.log(`Loaded template for workspace: ${workspace.title}`);
  }

  // ---------- Profile Management ----------
  private handleProfileCheckboxChange(e: Event, profileId: string): void {
    const workspace = this.getWorkspaceById(this.data.currentWorkspaceId);
    if (!workspace) return;

    const profile = workspace.profiles.find((p) => p.link === profileId);
    if (profile) {
      const target = e.target as HTMLInputElement;
      profile.checked = target.checked;
      this.updateProfileItemVisual(profileId, profile.checked);
      console.log(`Profile ${profile.name} checked: ${profile.checked}`);
    }

    this.saveToLocalStorage();
  }

  private handleProfileLinkClick(_e: MouseEvent, profileId: string): void {
    setTimeout(() => {
      const workspace = this.getWorkspaceById(this.data.currentWorkspaceId);
      if (!workspace) return;

      const profile = workspace.profiles.find((p) => p.link === profileId);
      if (profile && !profile.checked) {
        profile.checked = true;
        this.updateProfileItemVisual(profileId, true);

        const checkbox = document.querySelector<HTMLInputElement>(
          `input[data-profile-id="${profileId}"]`
        );
        if (checkbox) {
          checkbox.checked = true;
        }
        console.log(`Auto-checked profile: ${profile.name}`);
      }
    }, 100);
  }

  private updateProfileItemVisual(profileId: string, checked: boolean): void {
    const profileItem = document
      .querySelector<HTMLInputElement>(`input[data-profile-id="${profileId}"]`)
      ?.closest(".profile-item");
    if (profileItem) {
      checked
        ? profileItem.classList.add("checked")
        : profileItem.classList.remove("checked");
    }
  }

  // ---------- Template Management ----------
  private handleTemplateChange(e: InputEvent): void {
    if (this.data.currentWorkspaceId) {
      const workspace = this.getWorkspaceById(this.data.currentWorkspaceId);
      if (workspace) {
        const target = e.target as HTMLTextAreaElement;
        workspace.template = target.value;
        console.log("Template updated");
        this.saveToLocalStorage();
      }
    }
  }

  // ---------- Modal Management ----------
  openCreateWorkspaceModal(): void {
    const modal = document.getElementById("createWorkspaceModal");
    if (!modal) {
      console.error("Create workspace modal not found");
      return;
    }

    if (
      !this.data.settings.GEMINI_API_KEY ||
      !this.data.settings.GOOGLE_CUSTOM_SEARCH_API_KEY ||
      !this.data.settings.GOOGLE_CUSTOM_SEARCH_ID
    ) {
      alert("First add credentials in settings");
      this.openSettingsModal();
      return;
    }

    const form = document.getElementById(
      "createWorkspaceForm"
    ) as HTMLFormElement | null;
    if (form) form.reset();

    const titleInput = document.getElementById(
      "workspaceTitle"
    ) as HTMLInputElement | null;
    const queryCountInput = document.getElementById(
      "queryCount"
    ) as HTMLInputElement | null;
    const candidateCountInput = document.getElementById(
      "candidateCount"
    ) as HTMLInputElement | null;

    if (titleInput) titleInput.value = "Untitled";
    if (queryCountInput) queryCountInput.value = "3";
    if (candidateCountInput) candidateCountInput.value = "10";

    modal.classList.remove("hidden");
    console.log("Create workspace modal opened");
  }

  closeCreateWorkspaceModal(): void {
    const modal = document.getElementById("createWorkspaceModal");
    if (modal) {
      modal.classList.add("hidden");
      console.log("Create workspace modal closed");
    }
  }

  async handleCreateWorkspace(e: Event): Promise<void> {
    e.preventDefault();
    console.log("Handling create workspace submission");

    const titleInput = document.getElementById(
      "workspaceTitle"
    ) as HTMLInputElement | null;
    const jobDescriptionInput = document.getElementById(
      "jobDescription"
    ) as HTMLTextAreaElement | null;
    const candidateCountInput = document.getElementById(
      "candidateCount"
    ) as HTMLInputElement | null;
    const queryCountInput = document.getElementById(
      "queryCount"
    ) as HTMLInputElement | null;

    const lastWorkspaceId = this.data.workspaces.at(-1)?.id;
    const workspaceData: Workspace = {
      id: lastWorkspaceId ? lastWorkspaceId + 1 : 1,
      title: titleInput?.value || "Untitled",
      jobDescription: jobDescriptionInput?.value || "",
      candidateCount: candidateCountInput
        ? parseInt(candidateCountInput.value) || 10
        : 10,
      queryCount: queryCountInput ? parseInt(queryCountInput.value) || 3 : 3,
      profiles: [],
      template: this.getDefaultTemplate(),
    };

    this.closeCreateWorkspaceModal();

    this.withLoading(async () => {
      await this.openPreviewModal(workspaceData);
    });
  }

  async openPreviewModal(workspaceData: Workspace): Promise<void> {
    this.pendingWorkspaceData = workspaceData;

    const llm = new LLM(this.data.settings.GEMINI_API_KEY);
    this.pendingSearchQuery = await llm.getQueries(
      workspaceData.jobDescription,
      workspaceData.queryCount
    );

    const searchQueries = document.getElementById(
      "searchQueries"
    ) as HTMLTextAreaElement | null;
    if (searchQueries) searchQueries.value = this.pendingSearchQuery.join("\n");

    const modal = document.getElementById("previewModal");
    if (modal) {
      modal.classList.remove("hidden");
      console.log("Preview modal opened");
    }
  }

  closePreviewModal(): void {
    const modal = document.getElementById("previewModal");
    if (modal) {
      modal.classList.add("hidden");
      console.log("Preview modal closed");
    }
  }

  async handlePreviewSubmit(e: Event): Promise<void> {
    e.preventDefault();
    console.log("Handling preview submission");

    if (!this.pendingWorkspaceData) return;
    console.log("Pending workspace data:", this.pendingWorkspaceData);

    this.closePreviewModal();
    this.showLoading();

    try {
      const res = await searchCandidates(
        this.pendingSearchQuery!,
        this.pendingWorkspaceData.candidateCount,
        {
          API_KEY: this.data.settings.GOOGLE_CUSTOM_SEARCH_API_KEY,
          CX: this.data.settings.GOOGLE_CUSTOM_SEARCH_ID,
        }
      );
      console.log("Results: ", res);

      // const newWorkspace: Workspace = {
      //   id: this.pendingWorkspaceData,
      //   title: this.pendingWorkspaceData.title,
      //   jobDescription: this.pendingWorkspaceData.jobDescription || "",
      //   candidateCount: this.pendingWorkspaceData.candidateCount || 10,
      //   queryCount: this.pendingWorkspaceData.queryCount || 3,
      //   profiles: this.generateMockProfiles(
      //     this.pendingWorkspaceData.candidateCount || 10
      //   ),
      //   template: this.getDefaultTemplate(),
      // };

      this.data.workspaces.push({
        ...this.pendingWorkspaceData,
        profiles: res.map((p) => ({ ...p, checked: false })),
      });
      this.hideLoading();
      this.switchToWorkspace(this.pendingWorkspaceData.id);
      console.log(
        "New workspace created successfully:",
        this.pendingWorkspaceData.title
      );
      this.pendingWorkspaceData = null;
    } catch (error) {
      console.error("Error submitting preview:", error);
      this.hideLoading();
    }
  }

  openSettingsModal(): void {
    const modal = document.getElementById("settingsModal");
    if (!modal) {
      console.error("Settings modal not found");
      return;
    }

    const settings = this.data.settings;

    const googleApiKeyInput = document.getElementById(
      "googleApiKey"
    ) as HTMLInputElement | null;
    const googleSearchIdInput = document.getElementById(
      "googleSearchId"
    ) as HTMLInputElement | null;
    const geminiApiKeyInput = document.getElementById(
      "geminiApiKey"
    ) as HTMLInputElement | null;

    if (googleApiKeyInput)
      googleApiKeyInput.value = settings.GOOGLE_CUSTOM_SEARCH_API_KEY || "";
    if (googleSearchIdInput)
      googleSearchIdInput.value = settings.GOOGLE_CUSTOM_SEARCH_ID || "";
    if (geminiApiKeyInput)
      geminiApiKeyInput.value = settings.GEMINI_API_KEY || "";

    modal.classList.remove("hidden");
    console.log("Settings modal opened");
  }

  closeSettingsModal(): void {
    const modal = document.getElementById("settingsModal");
    if (modal) {
      modal.classList.add("hidden");
      console.log("Settings modal closed");
    }
  }

  handleSettingsSubmit(e: Event): void {
    e.preventDefault();
    console.log("Handling settings submission");

    const googleApiKeyInput = document.getElementById(
      "googleApiKey"
    ) as HTMLInputElement | null;
    const googleSearchIdInput = document.getElementById(
      "googleSearchId"
    ) as HTMLInputElement | null;
    const geminiApiKeyInput = document.getElementById(
      "geminiApiKey"
    ) as HTMLInputElement | null;

    this.data.settings = {
      GOOGLE_CUSTOM_SEARCH_API_KEY: googleApiKeyInput?.value || "",
      GOOGLE_CUSTOM_SEARCH_ID: googleSearchIdInput?.value || "",
      GEMINI_API_KEY: geminiApiKeyInput?.value || "",
    };

    this.closeSettingsModal();
    this.showTemporaryMessage("Settings saved successfully!", "success");
  }

  // ---------- Utility Methods ----------
  private getWorkspaceById(id: number | null): Workspace | undefined {
    if (id === null) return undefined;
    return this.data.workspaces.find((w) => w.id === id);
  }

  private generateMockQueries(
    jobDescription: string,
    queryCount: number
  ): string[] {
    const baseQueries = [
      "Software Engineer Python Django experience",
      "Backend Developer REST API microservices",
      "Full Stack Developer React Node.js",
      "Frontend Developer JavaScript TypeScript",
      "DevOps Engineer AWS Docker Kubernetes",
    ];

    return baseQueries.slice(0, queryCount);
  }

  private getDefaultTemplate(): string {
    return `Hi [Name],

Content

Best regards,
Your Name`;
  }

  private showLoading(): void {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
      loadingOverlay.classList.remove("hidden");
      console.log("Loading overlay shown");
    }
  }

  private hideLoading(): void {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
      console.log("Loading overlay hidden");
    }
  }

  async withLoading<T>(promise: () => Promise<T>): Promise<T> {
    this.showLoading();

    try {
      try {
        const result = await promise();
        return result;
      } catch (error) {
        throw error;
      }
    } finally {
      this.hideLoading();
    }
  }

  showTemporaryMessage(
    message: string,
    type: "info" | "success" | "error" = "info"
  ): void {
    const messageEl = document.createElement("div");
    messageEl.className = `status status--${type}`;
    messageEl.textContent = message;
    messageEl.style.position = "fixed";
    messageEl.style.top = "20px";
    messageEl.style.right = "20px";
    messageEl.style.zIndex = "3000";

    document.body.appendChild(messageEl);
    console.log(`Temporary message shown: ${message}`);

    setTimeout(() => {
      messageEl.remove();
    }, 3000);
  }
}

const workspaceManager = new WorkspaceManager();

window.addEventListener("beforeunload", () => {
  workspaceManager.saveToLocalStorage();
});

// Add CSS animation for temporary messages
const style = document.createElement("style");
style.textContent = `
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`;
document.head.appendChild(style);
