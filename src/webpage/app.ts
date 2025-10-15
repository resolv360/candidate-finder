import {
  ModalHandlers,
  Profile,
  Workspace,
  WorkspaceManagerData,
} from "./types";
import { decodeHtmlEntities, downloadCSV, fetchWorkspaceData, getApiKeys, getDefaultWorkspaceManagerData } from "./utils";

import { LLM } from "./llm";
import { LeadGenManager } from "./leadgen";
import { WorkspaceStorage } from "./workspace-storage";
import { searchCandidates } from "./candidate-search";

let tempNewWorkspaceData: Partial<Workspace> | null = null;

export class WorkspaceManager {
  data: WorkspaceManagerData = getDefaultWorkspaceManagerData();
  private nextWorkspaceId: number = 1;
  private nextProfileId: number;
  private pendingWorkspaceData: Workspace | null;
  private pendingSearchQuery: string[] | null = null;

  constructor() {
    this.withLoading(this.fetchFromLocalStorage.bind(this)).then(async (data) => {
      this.data = data;
      this.nextWorkspaceId = await WorkspaceStorage.getNextWorkspaceId();
      this.init();
    });
    this.nextProfileId = 9;
    this.pendingWorkspaceData = null;
  }

  async saveToLocalStorage(): Promise<void> {
    try {
      // Save current workspace ID
      await WorkspaceStorage.setCurrentWorkspaceId(this.data.currentWorkspaceId);
      
      // Save each workspace individually
      for (const workspace of this.data.workspaces) {
        await WorkspaceStorage.saveWorkspace(workspace);
      }
      
      console.log("All workspaces saved successfully");
    } catch (error) {
      console.error("Error saving workspaces:", error);
    }
  }

  fetchFromLocalStorage(): Promise<WorkspaceManagerData> {
    return fetchWorkspaceData();
  }

  init(): void {
    console.log("Initializing WorkspaceManager...");
    this.bindStaticEvents();
    this.bindTabEvents();
    this.renderWorkspaceList();
    this.setInitialViewState();
    console.log("WorkspaceManager initialized successfully");
  }

  private setInitialViewState(): void {
    // Set the initial view state based on whether workspaces exist
    const currentWorkspace = this.getWorkspaceById(this.data.currentWorkspaceId);
    const workspaceContent = document.getElementById('workspaceContent');
    const workspaceView = document.getElementById('workspaceView');

    if (currentWorkspace && workspaceContent) {
      // Hide welcome view and show workspace content
      if (workspaceView) {
        workspaceView.classList.add('hidden');
        workspaceView.classList.remove('active');
      }
      workspaceContent.classList.remove('hidden');
      workspaceContent.classList.add('active');
    } else if (workspaceView) {
      // Show welcome view (already active by default)
      workspaceView.classList.remove('hidden');
      workspaceView.classList.add('active');
      if (workspaceContent) {
        workspaceContent.classList.add('hidden');
        workspaceContent.classList.remove('active');
      }
    }
  }

  public downloadCSV() {
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

    const getMoreCandidatesBtn = document.getElementById(
      "getMoreCandidatesBtn"
    ) as HTMLButtonElement | null;
    if (getMoreCandidatesBtn) {
      getMoreCandidatesBtn.onclick = (e) => {
        console.log("Get more candidates button clicked");
        this.getMoreCandidates();
      };
    }

    const downloadCSVBtn = document.getElementById(
      "workspaceDownloadCsvBtn"
    ) as HTMLButtonElement | null;
    if (downloadCSVBtn) {
      downloadCSVBtn.onclick = (e) => {
        console.log("Download CSV button clicked");
        this.downloadCSV();
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

    const templateTextarea = document.getElementById(
      "workspaceTemplateTextarea"
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
        navContents.forEach(content => {
          content.classList.remove('active');
        });
        
        // Hide all content views (add hidden, remove active)
        contentViews.forEach(view => {
          view.classList.add('hidden');
          view.classList.remove('active');
        });

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
            const workspaceContent = document.getElementById('workspaceContent');
            if (workspaceContent) {
              workspaceContent.classList.remove('hidden');
              workspaceContent.classList.add('active');
            }
          } else {
            const workspaceView = document.getElementById('workspaceView');
            if (workspaceView) {
              workspaceView.classList.remove('hidden');
              workspaceView.classList.add('active');
            }
          }
        } else if (viewName === 'leadgen') {
          // Show lead generation view and initialize manager
          const leadgenView = document.getElementById('leadgenView');
          if (leadgenView) {
            leadgenView.classList.remove('hidden');
            leadgenView.classList.add('active');
            if (!window.leadGenManager) {
              window.leadGenManager = LeadGenManager.getInstance();
            }
            // Setup variable listeners after view is active
            window.leadGenManager.setupVariableListeners();
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
      const workspaceWrapper = document.createElement("div");
      workspaceWrapper.className = "workspace-item-wrapper";

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

      const duplicateBtn = document.createElement("button");
      duplicateBtn.className = "workspace-action-btn";
      duplicateBtn.innerHTML = "🔄";
      duplicateBtn.title = "Duplicate workspace";
      duplicateBtn.type = "button";
      duplicateBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.duplicateWorkspace(workspace.id);
      };

      workspaceWrapper.appendChild(workspaceItem);
      workspaceWrapper.appendChild(duplicateBtn);
      workspaceList.appendChild(workspaceWrapper);
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

    // Hide all content views (add hidden, remove active)
    document.querySelectorAll('.content-view').forEach(view => {
      view.classList.add('hidden');
      view.classList.remove('active');
    });
    
    // Show workspace content (remove hidden, add active)
    workspaceContent.classList.remove('hidden');
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
      "workspaceTemplateTextarea"
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

  private async handleProfileLinkClick(e: MouseEvent, profileId: string): Promise<void> {
    const isUserGesture = Boolean(e?.isTrusted);
    if (isUserGesture) {
      e.preventDefault();
    }

    const workspace = this.getWorkspaceById(this.data.currentWorkspaceId);
    if (!workspace) {
      console.error("Workspace not found while handling profile click");
      return;
    }

    const profile = workspace.profiles.find((p) => p.link === profileId);
    if (!profile) {
      console.error(`Profile with ID ${profileId} not found in current workspace`);
      return;
    }

    if (!profile.checked) {
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

    const templateTextarea = document.getElementById(
      "workspaceTemplateTextarea"
    ) as HTMLTextAreaElement | null;
    const baseTemplate = workspace.template || templateTextarea?.value || "";

    if (isUserGesture && baseTemplate.trim()) {
      const filledTemplate = baseTemplate.replace(/\[Name\]/gi, profile.name);

      if (templateTextarea) {
        templateTextarea.value = filledTemplate;
      }

      const copied = await this.copyTemplateToClipboard(filledTemplate);
      if (copied) {
        this.showTemporaryMessage(`Template ready for ${profile.name}`, "success");
      } else {
        this.showTemporaryMessage("Template populated but copy failed", "error");
      }
    } else if (isUserGesture && !baseTemplate.trim()) {
      this.showTemporaryMessage("Add a template before copying", "error");
    }

    this.saveToLocalStorage();

    if (isUserGesture) {
      window.open(profile.link, "_blank", "noopener");
    }
  }

  private async copyTemplateToClipboard(text: string): Promise<boolean> {
    if (!text) return false;

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text);
      } else {
        this.copyTextFallback(text);
      }
      return true;
    } catch (error) {
      console.error("Clipboard API failed, attempting fallback:", error);
      try {
        this.copyTextFallback(text);
        return true;
      } catch (fallbackError) {
        console.error("Fallback clipboard copy failed:", fallbackError);
        return false;
      }
    }
  }

  private copyTextFallback(text: string): void {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (!successful) {
      throw new Error("document.execCommand('copy') failed");
    }
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

    const apiKeys = getApiKeys();
    if (
      !apiKeys.GEMINI_API_KEY ||
      !apiKeys.GOOGLE_CUSTOM_SEARCH_API_KEY ||
      !apiKeys.GOOGLE_CUSTOM_SEARCH_ID
    ) {
      alert("Please add API keys to your .env file");
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

    const apiKeys = getApiKeys();
    const llm = new LLM(apiKeys.GEMINI_API_KEY);
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
    // Read the (possibly edited) queries from the textarea so generated queries are editable
    const searchQueriesEl = document.getElementById(
      "searchQueries"
    ) as HTMLTextAreaElement | null;

    const editedQueries = searchQueriesEl
      ? searchQueriesEl.value
          .split("\n")
          .map((q) => q.trim())
          .filter(Boolean)
      : null;

    // Use edited queries if provided, otherwise fall back to generated queries
    const queriesToUse = (editedQueries && editedQueries.length > 0)
      ? editedQueries
      : this.pendingSearchQuery || [];

    this.closePreviewModal();
    this.showLoading();

    try {
      const apiKeys = getApiKeys();

      // Check if this is an existing workspace (Get More Candidates) or new one
      const isExistingWorkspace = this.data.workspaces.some(
        (w) => w.id === this.pendingWorkspaceData!.id
      );

      // Get existing profile links to avoid duplicates
      const existingLinks = new Set<string>(
        this.pendingWorkspaceData.profiles.map((p) => p.link)
      );

      console.log(
        `Searching for candidates (existing: ${existingLinks.size}, requested: ${this.pendingWorkspaceData.candidateCount})`
      );

      const res = await searchCandidates(
        queriesToUse,
        this.pendingWorkspaceData.candidateCount,
        {
          API_KEY: apiKeys.GOOGLE_CUSTOM_SEARCH_API_KEY,
          CX: apiKeys.GOOGLE_CUSTOM_SEARCH_ID,
        },
        existingLinks // Pass existing links to avoid duplicates
      );
      console.log("Results: ", res);

      if (isExistingWorkspace) {
        // Get More Candidates: Add to existing workspace
        const workspace = this.getWorkspaceById(this.pendingWorkspaceData.id);
        if (workspace) {
          const newProfiles = res.map((p) => ({ ...p, checked: false }));
          workspace.profiles.push(...newProfiles);
          console.log(
            `Added ${newProfiles.length} new candidates to workspace: ${workspace.title}`
          );
          this.hideLoading();
          this.switchToWorkspace(workspace.id);
        }
      } else {
        // New workspace: Create and add
        this.data.workspaces.push({
          ...this.pendingWorkspaceData,
          profiles: res.map((p) => ({ ...p, checked: false })),
        });
        this.hideLoading();
        this.switchToWorkspace(this.pendingWorkspaceData.id);
        console.log("New workspace created successfully:", this.pendingWorkspaceData.title);
      }

      this.pendingWorkspaceData = null;
    } catch (error) {
      console.error("Error submitting preview:", error);
      this.hideLoading();
    }
  }





  // ---------- Utility Methods ----------
  private getWorkspaceById(id: number | null): Workspace | undefined {
    if (id === null) return undefined;
    return this.data.workspaces.find((w) => w.id === id);
  }

  // ---------- Duplicate & Get More Methods ----------
  async duplicateWorkspace(workspaceId: number): Promise<void> {
    const originalWorkspace = this.getWorkspaceById(workspaceId);
    if (!originalWorkspace) {
      console.error(`Workspace with ID ${workspaceId} not found`);
      return;
    }

    // Create a new workspace with the same parameters but empty profiles
    const newWorkspaceData: Workspace = {
      id: this.nextWorkspaceId++,
      title: `${originalWorkspace.title} (Copy)`,
      jobDescription: originalWorkspace.jobDescription,
      candidateCount: originalWorkspace.candidateCount,
      queryCount: originalWorkspace.queryCount,
      profiles: [],
      template: originalWorkspace.template,
    };

    console.log(`Duplicating workspace: ${originalWorkspace.title}`);
    
    // Open preview modal to regenerate queries and start search
    await this.withLoading(async () => {
      await this.openPreviewModal(newWorkspaceData);
    });
  }

  async getMoreCandidates(): Promise<void> {
    const workspace = this.getWorkspaceById(this.data.currentWorkspaceId);
    if (!workspace) {
      console.error("No active workspace found");
      alert("Please select a workspace first");
      return;
    }

    console.log(`Getting more candidates for workspace: ${workspace.title}`);
    
    // Reuse the same workspace but fetch more results
    this.pendingWorkspaceData = workspace;

    const apiKeys = getApiKeys();
    const llm = new LLM(apiKeys.GEMINI_API_KEY);
    
    await this.withLoading(async () => {
      // Generate new queries
      this.pendingSearchQuery = await llm.getQueries(
        workspace.jobDescription,
        workspace.queryCount
      );

      const searchQueries = document.getElementById(
        "searchQueries"
      ) as HTMLTextAreaElement | null;
      if (searchQueries) searchQueries.value = this.pendingSearchQuery.join("\n");

      const modal = document.getElementById("previewModal");
      if (modal) {
        modal.classList.remove("hidden");
        console.log("Preview modal opened for getting more candidates");
      }
    });
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
