import { TemplateManager, UIManager } from './ui-manager';

import { AIRunsManager } from './storage';
import { APIManager } from './api-manager';
import { NewStartupFinderResponse } from './types';

export class LeadGenManager {
  private static instance: LeadGenManager | null = null;
  private isProcessing = false;
  private isInitialized = false;

  constructor() {
    // Singleton pattern to prevent multiple instances
    if (LeadGenManager.instance) {
      return LeadGenManager.instance;
    }
    
    LeadGenManager.instance = this;
    this.init();
  }

  /**
   * Setup variable button listeners - can be called when leadgen view is active
   */
  setupVariableListeners(): void {
    const leadgenView = document.getElementById('leadgenView');
    if (leadgenView) {
      const variableButtons = leadgenView.querySelectorAll('.variable-tag');
      console.log('Setting up variable buttons, found:', variableButtons.length);
      
      variableButtons.forEach((button, index) => {
        // Remove existing listeners to prevent duplicates
        const newButton = button.cloneNode(true);
        button.parentNode?.replaceChild(newButton, button);
        
        // Add click listener to the new button
        newButton.addEventListener('click', this.handleVariableClick);
        console.log(`Variable button ${index + 1} listener attached`);
      });
    } else {
      console.error('leadgenView not found, variable buttons will not work');
    }
  }

  /**
   * Handle variable button clicks
   */
  private handleVariableClick = (e: Event) => {
    const variable = (e.target as HTMLElement).getAttribute('data-variable');
    console.log('Variable clicked:', variable);
    if (variable) {
      // Remove the braces from the variable before adding
      const cleanVariable = variable.replace(/[{}]/g, '');
      TemplateManager.addVariableToTemplate(cleanVariable);
    }
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): LeadGenManager {
    if (!LeadGenManager.instance) {
      LeadGenManager.instance = new LeadGenManager();
    }
    return LeadGenManager.instance;
  }

  /**
   * Initialize the lead generation manager
   */
  private async init(): Promise<void> {
    // Prevent double initialization
    if (this.isInitialized) {
      console.log('LeadGenManager already initialized, skipping...');
      return;
    }

    console.log('Initializing LeadGenManager...');
    this.isInitialized = true;
    
    await this.setupEventListeners();
    await this.loadSettings();
    await AIRunsManager.updateRunsDropdown();
  }

  /**
   * Setup all event listeners
   */
  private async setupEventListeners(): Promise<void> {
    // Find Indian startups button
    const findStartupsBtn = document.getElementById('findStartupsBtn');
    if (findStartupsBtn) {
      findStartupsBtn.addEventListener('click', () => this.handleFindStartups());
    }

    // Settings button - open modal
    const settingsBtn = document.getElementById('leadgenSettingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettingsModal());
    }

    // Settings form
    const settingsForm = document.getElementById('leadSettingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
    }

    // Settings modal close buttons
    const closeBtn = document.getElementById('leadSettingsClose');
    const cancelBtn = document.getElementById('cancelLeadSettings');
    const backdrop = document.getElementById('leadSettingsBackdrop');
    
    if (closeBtn) closeBtn.addEventListener('click', () => this.closeSettingsModal());
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeSettingsModal());
    if (backdrop) backdrop.addEventListener('click', () => this.closeSettingsModal());

    // Template copy button
    const copyTemplateBtn = document.getElementById('leadgenCopyTemplateBtn');
    console.log('Template copy button found:', !!copyTemplateBtn);
    if (copyTemplateBtn) {
      copyTemplateBtn.addEventListener('click', () => TemplateManager.copyTemplate());
    }

    // Check if template textarea exists
    const templateTextarea = document.getElementById('leadgenTemplateTextarea');
    console.log('Template textarea found:', !!templateTextarea);

    // Setup variable buttons
    this.setupVariableListeners();

    // AI runs dropdown
    const aiRunsSelect = document.getElementById('aiRunsSelect') as HTMLSelectElement;
    if (aiRunsSelect) {
      aiRunsSelect.addEventListener('change', (e) => this.handleRunSelection(e));
    }

    // Clear runs button
    const clearRunsBtn = document.getElementById('clearRuns');
    if (clearRunsBtn) {
      clearRunsBtn.addEventListener('click', () => this.handleClearRuns());
    }
  }

  /**
   * Handle finding Indian startups
   */
  private async handleFindStartups(): Promise<void> {
    if (this.isProcessing) {
      console.log('Already processing, ignoring duplicate request...');
      return;
    }

    try {
      console.log('Starting startup search process...');
      this.isProcessing = true;
      const findBtn = document.getElementById('findStartupsBtn') as HTMLButtonElement;
      
      if (findBtn) {
        findBtn.disabled = true;
        findBtn.textContent = '🔍 Finding startups...';
      }

      // Get max startups from settings
      const maxStartups = parseInt(localStorage.getItem('leadgen_maxStartups') || '10');
      console.log(`Searching for ${maxStartups} startups...`);
      
      // Call API
      const response = await APIManager.findIndianStartups(maxStartups);
      console.log('API response received:', response);
      
      // Save run and display results
      await AIRunsManager.addNewRun(response, { maxStartups });
      await AIRunsManager.updateRunsDropdown();
      
      UIManager.displayStartupResults(response);
      UIManager.showToast(`✅ Found ${response.count} Indian startups!`, 'success');

    } catch (error) {
      console.error('Error finding startups:', error);
      UIManager.showToast('❌ Failed to find startups. Please check your API settings.', 'error');
    } finally {
      this.isProcessing = false;
      const findBtn = document.getElementById('findStartupsBtn') as HTMLButtonElement;
      
      if (findBtn) {
        findBtn.disabled = false;
        findBtn.textContent = '🔍 Find Indian Startups';
      }
      console.log('Startup search process completed.');
    }
  }

  /**
   * Open settings modal
   */
  private openSettingsModal(): void {
    const modal = document.getElementById('leadSettingsModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('active');
    }
  }

  /**
   * Close settings modal
   */
  private closeSettingsModal(): void {
    const modal = document.getElementById('leadSettingsModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('active');
    }
  }

  /**
   * Handle settings form submission
   */
  private handleSettingsSubmit(event: Event): void {
    event.preventDefault();
    
    const modal = document.getElementById('leadSettingsModal');
    const apiUrlInput = modal?.querySelector('#apiBaseUrl') as HTMLInputElement;
    const maxStartupsInput = modal?.querySelector('#maxStartups') as HTMLInputElement;
    
    // Save settings
    if (apiUrlInput) localStorage.setItem('leadgen_apiUrl', apiUrlInput.value);
    if (maxStartupsInput) localStorage.setItem('leadgen_maxStartups', maxStartupsInput.value);
    
    // Close modal
    this.closeSettingsModal();
    
    UIManager.showToast('Settings saved successfully', 'success');
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    const modal = document.getElementById('leadSettingsModal');
    const apiUrlInput = modal?.querySelector('#apiBaseUrl') as HTMLInputElement;
    const maxStartupsInput = modal?.querySelector('#maxStartups') as HTMLInputElement;

    if (apiUrlInput) apiUrlInput.value = localStorage.getItem('leadgen_apiUrl') || 'http://localhost:5000/';
    if (maxStartupsInput) maxStartupsInput.value = localStorage.getItem('leadgen_maxStartups') || '10';
  }

  /**
   * Handle AI run selection
   */
  private async handleRunSelection(event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const runId = select.value;
    
    if (!runId) return;
    
    try {
      const run = await AIRunsManager.getRunById(runId);
      if (run) {
        UIManager.displayStartupResults(run.response);
        UIManager.showToast(`Loaded run: ${run.name}`, 'info');
      }
    } catch (error) {
      console.error('Error loading run:', error);
      UIManager.showToast('❌ Failed to load run', 'error');
    }
  }

  /**
   * Handle clearing all runs
   */
  private async handleClearRuns(): Promise<void> {
    try {
      await AIRunsManager.clearAllRuns();
      await AIRunsManager.updateRunsDropdown();
      
      // Clear the results display
      const resultsContainer = document.getElementById('resultsContainer');
      if (resultsContainer) {
        resultsContainer.innerHTML = '<p class="text-center text-secondary">No runs available</p>';
      }
      
      UIManager.showToast('All runs cleared', 'info');
    } catch (error) {
      console.error('Error clearing runs:', error);
      UIManager.showToast('❌ Failed to clear runs', 'error');
    }
  }
}

// Export types and utilities for external use
export * from './types';
export * from './csv-export';
export { APIManager } from './api-manager';
export { UIManager, TemplateManager } from './ui-manager';
export { AIRunsManager } from './storage';
