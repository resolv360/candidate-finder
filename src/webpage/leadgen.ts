export interface LeadGenAPI {
  baseUrl: string;
}

export interface LeadGenFile {
  name: string;
  size: string;
  modified: string;
}

export interface CompanyData {
  company_name: string;
  company_website?: string;
  company_description?: string;
  company_industry?: string;
  company_headquarters?: string;
  funding_amount?: string;
  funding_round?: string;
  funding_date?: string;
  investors?: string[] | string;
  ceo_name?: string;
  source_title?: string;
  source_url?: string;
  source_website?: string;
  is_india_focused?: boolean;
  is_indian_company?: boolean;
  scraped_at?: string;
  country?: string;
  
  // Additional fields from actual API response
  additional_emails?: string[];
  company_about_page?: string | null;
  company_contact_page?: string | null;
  key_people?: any[];
  social_media_links?: Record<string, string>;
  
  // LinkedIn and founder data
  ceo_linkedin?: string;
  company_linkedin?: string;
  founder_linkedin_profiles?: Array<{
    name?: string;
    title?: string;
    url?: string;
    location?: string;
    description?: string;
    experience?: string;
    education?: string;
  }>;
  
  // LinkedIn connect strategy
  linkedin_connect_strategy?: {
    primary_message?: string;
    alternative_messages?: string[];
    message_tips?: string[];
    best_time_to_connect?: string;
    follow_up_strategy?: {
      day_1?: string;
      day_3?: string;
      week_1?: string;
      week_2?: string;
    };
  };
}

export interface WorkflowOutputData {
  data: CompanyData[];
  filename: string;
  last_modified: string;
  message: string;
  status: string;
}

export interface WorkflowResponse {
  status: string;
  message?: string;
  error?: string;
  companies_found?: number;
  indian_companies?: number;
  companies_with_linkedin_strategy?: number;
  settings_used?: {
    min_funding_millions?: number;
    max_companies?: number;
  };
  files?: string[];
  timestamp?: string;
}

export interface ExtractResponse {
  status: string;
  message?: string;
  error?: string;
  articles_processed?: number;
  companies_extracted?: number;
  indian_companies?: number;
  companies_with_funding_amount?: number;
  sources?: string[];
  settings_used?: {
    min_funding_millions?: number;
    max_companies?: number;
  };
  output_files?: string[];
}

export interface EnrichResponse {
  status: 'success' | 'error' | 'healthy';
  companies_processed?: number;
  contacts_found?: number;
  output_files?: string[];
  message?: string;
  error?: string;
}

export interface CompleteWorkflowResponse {
  status: 'success' | 'error' | 'healthy';
  companies_extracted?: number;
  companies_processed?: number;
  contacts_found?: number;
  articles_found?: number;
  output_files?: string[];
  message?: string;
  error?: string;
}

export interface LatestOutputResponse {
  status: 'success' | 'error' | 'healthy';
  filename?: string;
  last_modified?: string;
  data?: CompanyData[];
  message?: string;
  error?: string;
}

export interface APIResponse<T = any> {
  status: 'success' | 'error' | 'healthy';
  error?: string;
  message?: string;
  timestamp?: string;
  [key: string]: any;
}

export class LeadGenManager {
  private baseUrl: string = 'http://localhost:5000';
  private statusElement: HTMLElement | null = null;
  private workflowStatusElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.bindEvents();
    this.loadSavedConfig();
  }

  private bindEvents(): void {
    // Test connection
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => this.testConnection());
    }

    // API URL input
    const apiBaseUrlInput = document.getElementById('apiBaseUrl') as HTMLInputElement;
    if (apiBaseUrlInput) {
      apiBaseUrlInput.addEventListener('change', (e) => {
        this.baseUrl = (e.target as HTMLInputElement).value;
        this.saveConfig();
      });
    }

    // Workflow buttons
    const extractDataBtn = document.getElementById('extractDataBtn');
    if (extractDataBtn) {
      extractDataBtn.addEventListener('click', () => this.extractData());
    }

    const enrichDataBtn = document.getElementById('enrichDataBtn');
    if (enrichDataBtn) {
      enrichDataBtn.addEventListener('click', () => this.enrichData());
    }

    const viewLatestBtn = document.getElementById('viewLatestBtn');
    if (viewLatestBtn) {
      viewLatestBtn.addEventListener('click', () => this.viewLatestOutput());
    }

    const completeWorkflowBtn = document.getElementById('completeWorkflowBtn');
    if (completeWorkflowBtn) {
      completeWorkflowBtn.addEventListener('click', () => this.completeWorkflow());
    }

    const refreshFilesBtn = document.getElementById('refreshFilesBtn');
    if (refreshFilesBtn) {
      refreshFilesBtn.addEventListener('click', () => this.refreshFiles());
    }

    // Cache status elements
    this.statusElement = document.getElementById('connectionStatus');
    this.workflowStatusElement = document.getElementById('workflowStatus');
  }

  private loadSavedConfig(): void {
    chrome.storage.local.get(['leadgenConfig'], (result) => {
      if (result.leadgenConfig) {
        this.baseUrl = result.leadgenConfig.baseUrl || 'http://localhost:5000';
        const urlInput = document.getElementById('apiBaseUrl') as HTMLInputElement;
        if (urlInput) {
          urlInput.value = this.baseUrl;
        }
      }
    });
  }

  private saveConfig(): void {
    chrome.storage.local.set({
      leadgenConfig: {
        baseUrl: this.baseUrl
      }
    });
  }

  private async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private setStatus(message: string, type: 'connected' | 'disconnected' | 'info'): void {
    if (!this.statusElement) return;
    
    this.statusElement.textContent = message;
    this.statusElement.className = `connection-status ${type}`;
  }

  private setWorkflowStatus(message: string, type: 'success' | 'error' | 'info'): void {
    if (!this.workflowStatusElement) return;
    
    this.workflowStatusElement.textContent = message;
    this.workflowStatusElement.className = `workflow-status ${type}`;
  }

  private setButtonLoading(buttonId: string, loading: boolean): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (!button) return;

    if (loading) {
      button.classList.add('loading');
      button.disabled = true;
    } else {
      button.classList.remove('loading');
      button.disabled = false;
    }
  }

  public async testConnection(): Promise<void> {
    this.setButtonLoading('testConnectionBtn', true);
    this.setStatus('Testing connection...', 'info');

    try {
      const response = await this.makeRequest('/api/health');
      
      if (response.status === 'success' || response.status === 'healthy') {
        this.setStatus('✅ Connected to Lead Generation API', 'connected');
      } else {
        this.setStatus('❌ Failed to connect to API', 'disconnected');
      }
    } catch (error) {
      this.setStatus('❌ Connection failed', 'disconnected');
    } finally {
      this.setButtonLoading('testConnectionBtn', false);
    }
  }

  public async extractData(): Promise<void> {
    this.setButtonLoading('extractDataBtn', true);
    this.setWorkflowStatus('Extracting Indian startup funding data from YourStory, Entrackr, Inc42...', 'info');

    try {
      const minFunding = (document.getElementById('minFunding') as HTMLInputElement)?.value || '5';
      const maxCompanies = (document.getElementById('maxCompanies') as HTMLInputElement)?.value || '30';

      const response: ExtractResponse = await this.makeRequest('/api/extract', { 
        method: 'POST',
        body: JSON.stringify({
          min_funding_millions: parseInt(minFunding),
          max_companies: parseInt(maxCompanies)
        })
      });
      
      if (response.status === 'success') {
        const message = response.message || 
          `✅ Extracted ${response.companies_extracted || 0} Indian companies from ${response.articles_processed || 0} articles`;
        this.setWorkflowStatus(message, 'success');
        
        // Display additional stats for Indian startup extraction
        if (response.indian_companies !== undefined) {
          this.setWorkflowStatus(
            `${message} | Indian companies: ${response.indian_companies} | With funding data: ${response.companies_with_funding_amount || 0}`,
            'success'
          );
        }
        
        if (response.output_files && response.output_files.length > 0) {
          console.log('Output files created:', response.output_files);
        }
        
        this.enableButton('enrichDataBtn');
        this.refreshFiles();
      } else {
        this.setWorkflowStatus(`❌ ${response.error || 'Failed to extract data'}`, 'error');
      }
    } catch (error) {
      console.error('Extract data error:', error);
      this.setWorkflowStatus('❌ Failed to extract Indian startup data', 'error');
    } finally {
      this.setButtonLoading('extractDataBtn', false);
    }
  }

  public async enrichData(): Promise<void> {
    this.setButtonLoading('enrichDataBtn', true);
    this.setWorkflowStatus('Enriching company data with contact information...', 'info');

    try {
      const response: EnrichResponse = await this.makeRequest('/api/enrich', { 
        method: 'POST',
        body: JSON.stringify({})
      });
      
      if (response.status === 'success') {
        const message = response.message || 
          `✅ Enriched ${response.companies_processed || 0} companies, found ${response.contacts_found || 0} contacts`;
        this.setWorkflowStatus(message, 'success');
        
        if (response.output_files && response.output_files.length > 0) {
          console.log('Output files created:', response.output_files);
        }
        
        this.refreshFiles();
      } else {
        this.setWorkflowStatus(`❌ ${response.error || 'Failed to enrich data'}`, 'error');
      }
    } catch (error) {
      console.error('Enrich data error:', error);
      this.setWorkflowStatus('❌ Failed to enrich data', 'error');
    } finally {
      this.setButtonLoading('enrichDataBtn', false);
    }
  }

  public async getLatestOutput(): Promise<LatestOutputResponse | null> {
    try {
      const response: LatestOutputResponse = await this.makeRequest('/api/latest-output');
      
      if (response.status === 'success') {
        console.log('Latest output loaded:', response.filename);
        return response;
      } else {
        console.error('Failed to get latest output:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Get latest output error:', error);
      return null;
    }
  }

  public async viewLatestOutput(): Promise<void> {
    this.setButtonLoading('viewLatestBtn', true);
    this.setWorkflowStatus('Loading latest workflow output...', 'info');

    try {
      const response = await this.getLatestOutput();
      
      if (response && response.status === 'success') {
        const message = response.message || 
          `✅ Latest output loaded: ${response.filename} (${response.last_modified})`;
        this.setWorkflowStatus(message, 'success');
        
        // Display the data in the UI
        if (response.data) {
          console.log('Latest workflow data loaded:', response.data.length, 'companies');
          this.displayLatestOutputData(response);
        } else {
          this.setWorkflowStatus('✅ Latest output loaded but no data available', 'success');
        }
      } else {
        this.setWorkflowStatus(`❌ No latest output found - ${response?.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('View latest output error:', error);
      this.setWorkflowStatus('❌ Failed to load latest output', 'error');
    } finally {
      this.setButtonLoading('viewLatestBtn', false);
    }
  }

  private displayLatestOutputData(response: LatestOutputResponse): void {
    // Display the latest output data in the preview section
    const previewElement = document.getElementById('companiesPreview');
    if (!previewElement || !response.data) return;

    // According to the API docs, data should be an array of CompanyData directly
    const companies: CompanyData[] = Array.isArray(response.data) ? response.data : [];

    if (companies.length === 0) {
      previewElement.innerHTML = '<p class="text-center text-secondary">No companies in latest output</p>';
      return;
    }

    const companiesHTML = companies.slice(0, 10).map((company: CompanyData) => `
      <div class="company-item">
        <div class="company-name">${company.company_name || 'Unknown Company'}</div>
        <div class="company-details">
          ${company.funding_amount ? `<strong>Funding:</strong> ${company.funding_amount}<br>` : ''}
          ${company.funding_round ? `<strong>Round:</strong> ${company.funding_round}<br>` : ''}
          ${company.funding_date ? `<strong>Date:</strong> ${company.funding_date}<br>` : ''}
          ${company.company_industry ? `<strong>Industry:</strong> ${company.company_industry}<br>` : ''}
          ${company.company_headquarters ? `<strong>Location:</strong> ${company.company_headquarters}<br>` : ''}
          ${company.ceo_name ? `<strong>CEO:</strong> ${company.ceo_name}<br>` : ''}
          ${company.company_website ? `<strong>Website:</strong> <a href="${company.company_website}" target="_blank" rel="noopener">${company.company_website}</a><br>` : ''}
          ${company.investors ? `<strong>Investors:</strong> ${Array.isArray(company.investors) ? company.investors.join(', ') : company.investors}<br>` : ''}
          ${company.company_description ? `<div style="margin-top: 8px;"><strong>Description:</strong> ${company.company_description.length > 200 ? company.company_description.substring(0, 200) + '...' : company.company_description}</div>` : ''}
          ${company.company_linkedin ? `<div style="margin-top: 8px;"><strong>LinkedIn:</strong> <a href="${company.company_linkedin}" target="_blank" rel="noopener">Company Profile</a></div>` : ''}
          ${company.ceo_linkedin ? `<div style="margin-top: 8px;"><strong>CEO LinkedIn:</strong> <a href="${company.ceo_linkedin}" target="_blank" rel="noopener">CEO Profile</a></div>` : ''}
          
          ${company.social_media_links && Object.keys(company.social_media_links).length > 0 ? `
            <div style="margin-top: 8px;">
              <strong>Social Media:</strong><br>
              ${Object.entries(company.social_media_links).map(([platform, url]) => 
                `<a href="${url}" target="_blank" rel="noopener" style="margin-right: 12px; color: var(--color-primary);">${platform.charAt(0).toUpperCase() + platform.slice(1)}</a>`
              ).join('')}
            </div>
          ` : ''}

          ${company.additional_emails && company.additional_emails.length > 0 ? `
            <div style="margin-top: 8px;">
              <strong>Additional Emails:</strong> ${company.additional_emails.join(', ')}
            </div>
          ` : ''}
          
          ${company.founder_linkedin_profiles && company.founder_linkedin_profiles.length > 0 ? `
            <div style="margin-top: 8px;">
              <strong>Founder Profiles:</strong><br>
              ${company.founder_linkedin_profiles.map(founder => 
                `<div style="margin-left: 16px;">
                  <a href="${founder.url || '#'}" target="_blank" rel="noopener">${founder.name || 'Unknown'}</a>
                  ${founder.title ? ` - ${founder.title}` : ''}
                  ${founder.location ? ` (${founder.location})` : ''}
                </div>`
              ).join('')}
            </div>
          ` : ''}

          ${company.linkedin_connect_strategy ? `
            <div style="margin-top: 12px; padding: 12px; background: var(--color-surface-secondary); border-radius: 8px;">
              <strong style="color: var(--color-primary);">LinkedIn Connect Strategy</strong>
              ${company.linkedin_connect_strategy.primary_message ? `
                <div style="margin-top: 8px;">
                  <strong>Primary Message:</strong>
                  <div style="font-style: italic; margin: 4px 0; padding: 8px; background: var(--color-surface); border-radius: 4px;">"${company.linkedin_connect_strategy.primary_message}"</div>
                </div>
              ` : ''}
              
              ${company.linkedin_connect_strategy.best_time_to_connect ? `
                <div style="margin-top: 8px;"><strong>Best Time:</strong> ${company.linkedin_connect_strategy.best_time_to_connect}</div>
              ` : ''}

              ${company.linkedin_connect_strategy.message_tips && company.linkedin_connect_strategy.message_tips.length > 0 ? `
                <div style="margin-top: 8px;">
                  <strong>Tips:</strong>
                  <ul style="margin: 4px 0; padding-left: 20px;">
                    ${company.linkedin_connect_strategy.message_tips.map(tip => `<li style="margin: 2px 0;">${tip}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    const totalText = companies.length > 10 ? ` (showing first 10 of ${companies.length})` : ` (${companies.length} total)`;
    
    previewElement.innerHTML = `
      <div style="margin-bottom: 16px; font-weight: 500; color: var(--color-text-secondary);">
        Latest Workflow Output: ${response.filename}${totalText}
        <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: 4px;">
          Last modified: ${new Date(response.last_modified || '').toLocaleString()}
        </div>
      </div>
      ${companiesHTML}
    `;
  }

  public async completeWorkflow(): Promise<void> {
    this.setButtonLoading('completeWorkflowBtn', true);
    this.setWorkflowStatus('Running complete Indian startup workflow...', 'info');

    try {
      const minFunding = (document.getElementById('minFunding') as HTMLInputElement)?.value || '5';
      const maxCompanies = (document.getElementById('maxCompanies') as HTMLInputElement)?.value || '30';

      const response: WorkflowResponse = await this.makeRequest('/api/workflow/complete', { 
        method: 'POST',
        body: JSON.stringify({
          min_funding_millions: parseInt(minFunding),
          max_companies: parseInt(maxCompanies)
        })
      });
      
      if (response.status === 'success') {
        const message = response.message || 
          `✅ Complete workflow finished! Found ${response.companies_found || 0} companies (${response.indian_companies || 0} Indian) with LinkedIn strategies`;
        this.setWorkflowStatus(message, 'success');
        
        // Display detailed stats
        if (response.companies_with_linkedin_strategy !== undefined) {
          this.setWorkflowStatus(
            `${message} | LinkedIn strategies: ${response.companies_with_linkedin_strategy}`,
            'success'
          );
        }
        
        if (response.files && response.files.length > 0) {
          console.log('Output files created:', response.files);
        }
        
        this.enableButton('extractDataBtn');
        this.enableButton('enrichDataBtn');
        this.refreshFiles();
      } else {
        this.setWorkflowStatus(`❌ ${response.error || 'Complete workflow failed'}`, 'error');
      }
    } catch (error) {
      console.error('Complete workflow error:', error);
      this.setWorkflowStatus(`❌ Indian startup workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      this.setButtonLoading('completeWorkflowBtn', false);
    }
  }

  public async refreshFiles(): Promise<void> {
    this.setButtonLoading('refreshFilesBtn', true);

    try {
      const response = await this.makeRequest('/api/files');
      
      if (response.status === 'success') {
        this.renderFiles(response.files || []);
      }
    } catch (error) {
      console.error('Failed to refresh files:', error);
    } finally {
      this.setButtonLoading('refreshFilesBtn', false);
    }
  }

  private enableButton(buttonId: string): void {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (button) {
      button.disabled = false;
    }
  }

  private renderFiles(files: LeadGenFile[]): void {
    const filesListElement = document.getElementById('filesList');
    if (!filesListElement) return;

    if (files.length === 0) {
      filesListElement.innerHTML = '<p class="text-center text-secondary">No files found</p>';
      return;
    }

    // Organize files by type and date
    const organizedFiles = this.organizeFilesByTypeAndDate(files);
    
    let filesHTML = '';
    
    // Generate HTML for each file type category
    for (const [fileType, dateGroups] of Object.entries(organizedFiles)) {
      filesHTML += `
        <div class="file-category">
          <div class="file-category-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="folder-icon">📁</span>
            <span class="category-name">${this.getFileTypeDisplayName(fileType)}</span>
            <span class="file-count">(${this.getTotalFilesInCategory(dateGroups)})</span>
            <span class="expand-icon">▼</span>
          </div>
          <div class="file-category-content">
      `;
      
      // Sort dates in descending order (newest first)
      const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
      
      for (const date of sortedDates) {
        const filesForDate = dateGroups[date];
        if (filesForDate.length > 0) {
          filesHTML += `
            <div class="file-date-group">
              <div class="file-date-header" onclick="this.parentElement.classList.toggle('collapsed')">
                <span class="date-icon">📅</span>
                <span class="date-name">${this.formatDateForDisplay(date)}</span>
                <span class="file-count">(${filesForDate.length})</span>
                <span class="expand-icon">▼</span>
              </div>
              <div class="file-date-content">
          `;
          
          // Sort files by time (newest first)
          const sortedFiles = filesForDate.sort((a, b) => b.modified.localeCompare(a.modified));
          
          for (const file of sortedFiles) {
            filesHTML += `
              <div class="file-item" onclick="leadGenManager.previewFile('${file.name}')">
                <div class="file-info">
                  <div class="file-name">${file.name}</div>
                  <div class="file-meta">${file.size} • ${this.formatDateTime(file.modified)}</div>
                </div>
                <div class="file-actions">
                  <button class="btn btn--outline btn--small" onclick="event.stopPropagation(); leadGenManager.downloadFile('${file.name}')">
                    Download
                  </button>
                </div>
              </div>
            `;
          }
          
          filesHTML += `
              </div>
            </div>
          `;
        }
      }
      
      filesHTML += `
          </div>
        </div>
      `;
    }

    filesListElement.innerHTML = filesHTML;
  }

  private organizeFilesByTypeAndDate(files: LeadGenFile[]): Record<string, Record<string, LeadGenFile[]>> {
    const organized: Record<string, Record<string, LeadGenFile[]>> = {};
    
    for (const file of files) {
      const fileType = this.getFileType(file.name);
      const fileDate = this.extractDateFromFile(file);
      
      if (!organized[fileType]) {
        organized[fileType] = {};
      }
      
      if (!organized[fileType][fileDate]) {
        organized[fileType][fileDate] = [];
      }
      
      organized[fileType][fileDate].push(file);
    }
    
    return organized;
  }

  private getFileType(filename: string): string {
    // Extract file type based on filename patterns from API documentation
    if (filename.includes('comprehensive_funding_data')) return 'funding_data';
    if (filename.includes('crm_export_')) return 'crm_exports';
    if (filename.includes('complete_workflow_')) return 'complete_workflows';
    if (filename.includes('api_extraction_')) return 'api_extractions';
    if (filename.includes('report_')) return 'reports';
    if (filename.includes('funding_articles')) return 'funding_articles';
    if (filename.includes('extracted_companies')) return 'extracted_data';
    if (filename.includes('enriched_companies')) return 'enriched_data';
    if (filename.includes('contacts_export')) return 'contacts_exports';
    if (filename.includes('batch_research_results')) return 'research_data';
    if (filename.match(/research_.*\.json/)) return 'research_data';
    
    // Fallback to file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv': return 'csv_files';
      case 'json': return 'json_files';
      case 'txt': return 'text_files';
      default: return 'other_files';
    }
  }

  private getFileTypeDisplayName(fileType: string): string {
    const displayNames: Record<string, string> = {
      'funding_data': 'Funding Data',
      'crm_exports': 'CRM Exports',
      'complete_workflows': 'Complete Workflows',
      'api_extractions': 'API Extractions',
      'reports': 'Reports',
      'funding_articles': 'Funding Articles',
      'extracted_data': 'Extracted Companies',
      'enriched_data': 'Enriched Companies',
      'contacts_exports': 'Contact Exports',
      'research_data': 'Company Research',
      'csv_files': 'CSV Files',
      'json_files': 'JSON Files',
      'text_files': 'Text Files',
      'other_files': 'Other Files'
    };
    
    return displayNames[fileType] || fileType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private extractDateFromFile(file: LeadGenFile): string {
    // Try to extract date from filename first
    const dateMatch = file.name.match(/(\d{8})/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      return `${dateStr.substr(0, 4)}-${dateStr.substr(4, 2)}-${dateStr.substr(6, 2)}`;
    }
    
    // Fallback to file modified date
    const modifiedDate = new Date(file.modified);
    return modifiedDate.toISOString().split('T')[0];
  }

  private formatDateForDisplay(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  private formatDateTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getTotalFilesInCategory(dateGroups: Record<string, LeadGenFile[]>): number {
    return Object.values(dateGroups).reduce((total, files) => total + files.length, 0);
  }

  public async downloadFile(filename: string): Promise<void> {
    try {
      const url = `${this.baseUrl}/api/download/${filename}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      this.setWorkflowStatus(`❌ Download failed: ${filename}`, 'error');
    }
  }

  public async previewFile(filename: string): Promise<void> {
    if (!filename.endsWith('.json')) {
      this.downloadFile(filename);
      return;
    }

    try {
      const response = await this.makeRequest(`/api/view/${filename}`);
      
      if (response.status === 'success') {
        console.log('File preview data:', response.data);
      } else {
        console.error('Failed to preview file:', response.error);
      }
    } catch (error) {
      console.error('Preview failed:', error);
    }
  }
}

// Make it globally available
declare global {
  interface Window {
    leadGenManager?: LeadGenManager;
  }
}
