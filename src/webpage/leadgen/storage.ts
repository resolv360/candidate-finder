import { AIStartupRun, AIRunsStorage } from './types';

export class AIRunsManager {
  private static readonly STORAGE_KEY = 'ai_startup_runs';

  /**
   * Load all AI runs from Chrome storage
   */
  static async loadAIRuns(): Promise<AIStartupRun[]> {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      const storage: AIRunsStorage = result[this.STORAGE_KEY] || { runs: [] };
      return storage.runs;
    } catch (error) {
      console.error('Error loading AI runs:', error);
      return [];
    }
  }

  /**
   * Save AI runs to Chrome storage
   */
  static async saveAIRuns(runs: AIStartupRun[]): Promise<void> {
    try {
      const storage: AIRunsStorage = { runs };
      await chrome.storage.local.set({ [this.STORAGE_KEY]: storage });
    } catch (error) {
      console.error('Error saving AI runs:', error);
      throw error;
    }
  }

  /**
   * Create a new AI run
   */
  static createNewRun(response: any, params: any): AIStartupRun {
    return {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      response,
      params,
      name: `Run ${new Date().toLocaleString()}`
    };
  }

  /**
   * Add a new AI run to storage
   */
  static async addNewRun(response: any, params: any): Promise<AIStartupRun> {
    try {
      console.log('Adding new AI run to storage...');
      
      const existingRuns = await this.loadAIRuns();
      
      // Check if a run with the same response was added within the last 5 seconds
      // This prevents duplicate saves
      const now = Date.now();
      const recentRuns = existingRuns.filter(run => {
        const runTime = new Date(run.timestamp).getTime();
        return (now - runTime) < 5000; // Within 5 seconds
      });
      
      // Check if any recent run has the same response data
      const isDuplicate = recentRuns.some(run => {
        return JSON.stringify(run.response) === JSON.stringify(response) &&
               JSON.stringify(run.params) === JSON.stringify(params);
      });
      
      if (isDuplicate) {
        console.log('Duplicate run detected, skipping save...');
        return recentRuns[0]; // Return the existing run
      }
      
      const newRun = this.createNewRun(response, params);
      
      // Add new run to the beginning
      const updatedRuns = [newRun, ...existingRuns];
      
      // Keep only the latest 50 runs to prevent storage bloat
      const trimmedRuns = updatedRuns.slice(0, 50);
      
      await this.saveAIRuns(trimmedRuns);
      console.log('New AI run saved successfully');
      return newRun;
    } catch (error) {
      console.error('Error adding new run:', error);
      throw error;
    }
  }

  /**
   * Get a specific run by ID
   */
  static async getRunById(runId: string): Promise<AIStartupRun | null> {
    try {
      const runs = await this.loadAIRuns();
      return runs.find(run => run.id === runId) || null;
    } catch (error) {
      console.error('Error getting run by ID:', error);
      return null;
    }
  }

  /**
   * Clear all AI runs
   */
  static async clearAllRuns(): Promise<void> {
    try {
      await this.saveAIRuns([]);
    } catch (error) {
      console.error('Error clearing runs:', error);
      throw error;
    }
  }

  /**
   * Update runs dropdown in UI
   */
  static async updateRunsDropdown(): Promise<void> {
    try {
      const runs = await this.loadAIRuns();
      const dropdown = document.getElementById('aiRunsSelect') as HTMLSelectElement;
      
      if (!dropdown) return;

      // Clear existing options
      dropdown.innerHTML = '<option value="">Select a previous run...</option>';

      // Add runs to dropdown
      runs.forEach(run => {
        const option = document.createElement('option');
        option.value = run.id;
        option.textContent = `${run.name} (${run.response.count} results)`;
        dropdown.appendChild(option);
      });
    } catch (error) {
      console.error('Error updating runs dropdown:', error);
    }
  }
}
