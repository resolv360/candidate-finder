import { Workspace } from './types';

/**
 * Workspace Storage Manager
 * Manages persistent storage of workspaces, similar to AI Runs storage
 * Each workspace is stored separately for better reliability
 */
export class WorkspaceStorage {
  private static readonly STORAGE_PREFIX = 'workspace_';
  private static readonly WORKSPACE_LIST_KEY = 'workspace_list';
  private static readonly CURRENT_WORKSPACE_KEY = 'current_workspace_id';

  /**
   * Get list of all workspace IDs
   */
  static async getWorkspaceList(): Promise<number[]> {
    try {
      const data = localStorage.getItem(this.WORKSPACE_LIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading workspace list:', error);
      return [];
    }
  }

  /**
   * Save workspace list
   */
  private static async saveWorkspaceList(workspaceIds: number[]): Promise<void> {
    try {
      localStorage.setItem(this.WORKSPACE_LIST_KEY, JSON.stringify(workspaceIds));
      console.log('Workspace list saved:', workspaceIds);
    } catch (error) {
      console.error('Error saving workspace list:', error);
      throw error;
    }
  }

  /**
   * Load a single workspace by ID
   */
  static async loadWorkspace(workspaceId: number): Promise<Workspace | null> {
    try {
      const key = `${this.STORAGE_PREFIX}${workspaceId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const workspace = JSON.parse(data);
        console.log(`Loaded workspace ${workspaceId}:`, workspace.title);
        return workspace;
      }
      return null;
    } catch (error) {
      console.error(`Error loading workspace ${workspaceId}:`, error);
      return null;
    }
  }

  /**
   * Load all workspaces
   */
  static async loadAllWorkspaces(): Promise<Workspace[]> {
    try {
      const workspaceIds = await this.getWorkspaceList();
      const workspaces: Workspace[] = [];

      for (const id of workspaceIds) {
        const workspace = await this.loadWorkspace(id);
        if (workspace) {
          workspaces.push(workspace);
        }
      }

      console.log(`Loaded ${workspaces.length} workspaces from storage`);
      return workspaces;
    } catch (error) {
      console.error('Error loading all workspaces:', error);
      return [];
    }
  }

  /**
   * Save a single workspace
   */
  static async saveWorkspace(workspace: Workspace): Promise<void> {
    try {
      const key = `${this.STORAGE_PREFIX}${workspace.id}`;
      localStorage.setItem(key, JSON.stringify(workspace));
      
      // Update workspace list
      const workspaceIds = await this.getWorkspaceList();
      if (!workspaceIds.includes(workspace.id)) {
        workspaceIds.push(workspace.id);
        await this.saveWorkspaceList(workspaceIds);
      }
      
      console.log(`Workspace ${workspace.id} saved:`, workspace.title);
    } catch (error) {
      console.error(`Error saving workspace ${workspace.id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a workspace
   */
  static async deleteWorkspace(workspaceId: number): Promise<void> {
    try {
      const key = `${this.STORAGE_PREFIX}${workspaceId}`;
      localStorage.removeItem(key);
      
      // Update workspace list
      const workspaceIds = await this.getWorkspaceList();
      const updatedIds = workspaceIds.filter(id => id !== workspaceId);
      await this.saveWorkspaceList(updatedIds);
      
      console.log(`Workspace ${workspaceId} deleted`);
    } catch (error) {
      console.error(`Error deleting workspace ${workspaceId}:`, error);
      throw error;
    }
  }

  /**
   * Get current workspace ID
   */
  static async getCurrentWorkspaceId(): Promise<number | null> {
    try {
      const data = localStorage.getItem(this.CURRENT_WORKSPACE_KEY);
      return data ? parseInt(data) : null;
    } catch (error) {
      console.error('Error getting current workspace ID:', error);
      return null;
    }
  }

  /**
   * Set current workspace ID
   */
  static async setCurrentWorkspaceId(workspaceId: number | null): Promise<void> {
    try {
      if (workspaceId === null) {
        localStorage.removeItem(this.CURRENT_WORKSPACE_KEY);
      } else {
        localStorage.setItem(this.CURRENT_WORKSPACE_KEY, workspaceId.toString());
      }
      console.log('Current workspace ID set to:', workspaceId);
    } catch (error) {
      console.error('Error setting current workspace ID:', error);
      throw error;
    }
  }

  /**
   * Clear all workspace data (use with caution)
   */
  static async clearAllWorkspaces(): Promise<void> {
    try {
      const workspaceIds = await this.getWorkspaceList();
      for (const id of workspaceIds) {
        const key = `${this.STORAGE_PREFIX}${id}`;
        localStorage.removeItem(key);
      }
      localStorage.removeItem(this.WORKSPACE_LIST_KEY);
      localStorage.removeItem(this.CURRENT_WORKSPACE_KEY);
      console.log('All workspaces cleared');
    } catch (error) {
      console.error('Error clearing workspaces:', error);
      throw error;
    }
  }

  /**
   * Get next available workspace ID
   */
  static async getNextWorkspaceId(): Promise<number> {
    const workspaceIds = await this.getWorkspaceList();
    if (workspaceIds.length === 0) {
      return 1;
    }
    return Math.max(...workspaceIds) + 1;
  }
}
