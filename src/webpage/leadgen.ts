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
}

export interface FilesResponse extends APIResponse {
  files?: LeadGenFile[];
  total?: number;
}

export interface SimpleStartupFinderResponse {
  success: boolean;
  count: number;
  data: Array<{
    startup_name: string;
    founder_name: string;
    role: string;
    industry: string;
    funding_stage: string;
    total_funding_usd_mil: number;
    funding_amount: string;
    funding_date: string;
    investors: string;
    valuation: string;
    linkedin_url: string;
    linkedin_type: string;
    connect_message: string | null;
  }>;
  timestamp: string;
}

export interface FilePreviewResponse extends APIResponse {
  data?: any;
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
    // Lead Settings Modal
    const leadgenSettingsBtn = document.getElementById('leadgenSettingsBtn');
    if (leadgenSettingsBtn) {
      leadgenSettingsBtn.addEventListener('click', () => this.showLeadSettingsModal());
    }

    // API URL input
    const apiBaseUrlInput = document.getElementById('apiBaseUrl') as HTMLInputElement;
    if (apiBaseUrlInput) {
      apiBaseUrlInput.addEventListener('change', (e) => {
        this.baseUrl = (e.target as HTMLInputElement).value;
        this.saveConfig();
      });
    }

    // Simple Startup Finder
    const findStartupsBtn = document.getElementById('findStartupsBtn');
    if (findStartupsBtn) {
      findStartupsBtn.addEventListener('click', () => this.findStartups());
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

  private showLeadSettingsModal(): void {
    const modal = document.getElementById('leadSettingsModal');
    if (!modal) return;

    // Load current values into the modal
    const apiUrlInput = modal.querySelector('#apiBaseUrl') as HTMLInputElement;
    const minFundingInput = modal.querySelector('#minFunding') as HTMLInputElement;
    const maxCompaniesInput = modal.querySelector('#maxCompanies') as HTMLInputElement;
    const maxStartupsInput = modal.querySelector('#maxStartups') as HTMLInputElement;

    if (apiUrlInput) apiUrlInput.value = this.baseUrl;
    if (minFundingInput) minFundingInput.value = localStorage.getItem('leadgen_minFunding') || '5';
    if (maxCompaniesInput) maxCompaniesInput.value = localStorage.getItem('leadgen_maxCompanies') || '30';
    if (maxStartupsInput) maxStartupsInput.value = localStorage.getItem('leadgen_maxStartups') || '10';

    modal.classList.remove('hidden');

    // Bind modal events
    const closeBtn = modal.querySelector('#leadSettingsClose');
    const cancelBtn = modal.querySelector('#cancelLeadSettings');
    const backdrop = modal.querySelector('#leadSettingsBackdrop');
    const form = modal.querySelector('#leadSettingsForm') as HTMLFormElement;

    const closeModal = () => {
      modal.classList.add('hidden');
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Save settings
      if (apiUrlInput) {
        this.baseUrl = apiUrlInput.value;
        localStorage.setItem('leadgen_apiBaseUrl', this.baseUrl);
      }
      if (minFundingInput) localStorage.setItem('leadgen_minFunding', minFundingInput.value);
      if (maxCompaniesInput) localStorage.setItem('leadgen_maxCompanies', maxCompaniesInput.value);
      if (maxStartupsInput) localStorage.setItem('leadgen_maxStartups', maxStartupsInput.value);

      this.saveConfig();
      closeModal();
      this.setStatus('✅ Settings saved', 'connected');
    });
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

  public async findStartups(): Promise<void> {
    this.setButtonLoading('findStartupsBtn', true);
    this.setWorkflowStatus('Finding new startups using Perplexity AI + Google Search...', 'info');

    try {
      const maxStartups = localStorage.getItem('leadgen_maxStartups') || '10';

      const response = await this.makeRequest(`/api/startups?max_companies=${maxStartups}`) as any;
      
      if (response.success) {
        const message = `✅ Found ${response.count} startups with LinkedIn profiles`;
        this.setWorkflowStatus(message, 'success');
        
        // Display the startups in the preview area
        this.displayStartupFinderResults(response as SimpleStartupFinderResponse);
      } else {
        this.setWorkflowStatus('❌ Failed to find startups', 'error');
      }
    } catch (error) {
      console.error('Find startups error:', error);
      this.setWorkflowStatus('❌ Failed to find startups', 'error');
    } finally {
      this.setButtonLoading('findStartupsBtn', false);
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

  private displayStartupFinderResults(response: SimpleStartupFinderResponse): void {
    const filesListElement = document.getElementById('filesList');
    const previewElement = document.getElementById('companiesPreview');
    
    if (!filesListElement || !previewElement || !response.data || response.data.length === 0) {
      if (previewElement) {
        previewElement.innerHTML = '<p class="text-center text-secondary">No startups found</p>';
      }
      return;
    }

    // Display startup list in the files section (left side)
    const startupListHTML = `
      <div style="margin-bottom: 16px; font-weight: 500; color: var(--color-text-secondary);">
        🔍 Found ${response.count} startups
      </div>
      <div class="startup-list">
        ${response.data.map((startup, index) => `
          <div class="startup-list-item" data-startup-index="${index}">
            <div class="startup-list-item-name">${startup.startup_name}</div>
            <div class="startup-list-item-meta">${startup.founder_name} • ${startup.industry}</div>
            <div class="startup-list-item-funding">${startup.funding_stage} • ${startup.funding_amount}</div>
          </div>
        `).join('')}
      </div>
    `;

    filesListElement.innerHTML = startupListHTML;

    // Initially show the first startup in the preview (right side)
    this.displayStartupDetails(response.data[0], 0);

    // Add click handlers for startup list items
    const startupItems = filesListElement.querySelectorAll('.startup-list-item');
    startupItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        // Remove active class from all items
        startupItems.forEach(i => i.classList.remove('active'));
        // Add active class to clicked item
        item.classList.add('active');
        // Display startup details
        this.displayStartupDetails(response.data[index], index);
      });
    });

    // Set first item as active
    if (startupItems.length > 0) {
      startupItems[0].classList.add('active');
    }
  }

  private displayStartupDetails(startup: any, index: number): void {
    const previewElement = document.getElementById('companiesPreview');
    if (!previewElement) return;

    const detailsHTML = `
      <div class="startup-details-view">
        <div class="startup-header">
          <div class="startup-title">
            <h2>${startup.startup_name}</h2>
            <div class="startup-meta">
              <span class="startup-role">${startup.role}</span>
              <span class="funding-badge" style="background: var(--color-success); color: white; padding: 4px 12px; border-radius: 16px; font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);">
                ${startup.funding_stage} • ${startup.funding_amount}
              </span>
            </div>
          </div>
          <div class="linkedin-actions">
            <a href="${startup.linkedin_url}" target="_blank" rel="noopener" class="btn btn--primary">
              👤 Open LinkedIn Profile
            </a>
          </div>
        </div>
        
        <div class="startup-info-section">
          <h3>Company Information</h3>
          <div class="startup-info-grid">
            <div class="info-item">
              <strong>Founder:</strong> ${startup.founder_name}
            </div>
            <div class="info-item">
              <strong>Industry:</strong> ${startup.industry}
            </div>
            <div class="info-item">
              <strong>Funding Stage:</strong> ${startup.funding_stage}
            </div>
            <div class="info-item">
              <strong>Funding Amount:</strong> ${startup.funding_amount}
            </div>
            <div class="info-item">
              <strong>Funding Date:</strong> ${startup.funding_date}
            </div>
            <div class="info-item">
              <strong>Total Funding:</strong> $${startup.total_funding_usd_mil}M USD
            </div>
            ${startup.investors !== "Not specified in search results" ? `
              <div class="info-item">
                <strong>Investors:</strong> ${startup.investors}
              </div>
            ` : ''}
            ${startup.valuation !== "Undisclosed" ? `
              <div class="info-item">
                <strong>Valuation:</strong> ${startup.valuation}
              </div>
            ` : ''}
          </div>
        </div>
        
        ${startup.connect_message ? `
        <div class="connect-message-section" style="margin-top: 24px; padding: 20px; background: var(--color-surface-secondary); border-radius: 12px; border: 1px solid var(--color-border-subtle);">
          <h3 style="color: var(--color-primary); display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            💬 LinkedIn Connect Message
          </h3>
          <div style="font-style: italic; margin: 12px 0; padding: 16px; background: var(--color-surface); border-radius: 8px; border-left: 4px solid var(--color-primary); line-height: 1.6; font-size: var(--font-size-base);">
            "${startup.connect_message}"
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <div style="font-size: var(--font-size-sm); color: var(--color-text-secondary);">
              💡 Ready to copy and paste on LinkedIn
            </div>
            <button class="btn btn--outline copy-message-btn" data-message="${startup.connect_message?.replace(/"/g, '&quot;') || ''}">
              📋 Copy Message
            </button>
          </div>
        </div>
        ` : `
        <div class="connect-message-section" style="margin-top: 24px; padding: 20px; background: var(--color-surface-secondary); border-radius: 12px; border: 1px solid var(--color-border-subtle); opacity: 0.7;">
          <h3 style="color: var(--color-text-secondary); display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            💬 LinkedIn Connect Message
          </h3>
          <div style="color: var(--color-text-secondary); font-style: italic; text-align: center; padding: 24px;">
            ❌ No connect message available for this startup
          </div>
        </div>
        `}
      </div>
    `;

    previewElement.innerHTML = detailsHTML;

    // Add copy functionality for the message button
    const copyButton = previewElement.querySelector('.copy-message-btn');
    if (copyButton) {
      copyButton.addEventListener('click', async (e) => {
        const btn = e.target as HTMLButtonElement;
        const message = btn.getAttribute('data-message');
        if (message) {
          try {
            await navigator.clipboard.writeText(message.replace(/&quot;/g, '"'));
            btn.textContent = '✅ Copied!';
            btn.style.background = 'var(--color-success)';
            btn.style.color = 'white';
            setTimeout(() => {
              btn.textContent = '📋 Copy Message';
              btn.style.background = '';
              btn.style.color = '';
            }, 2000);
          } catch (err) {
            console.error('Failed to copy message:', err);
            btn.textContent = '❌ Failed';
            setTimeout(() => {
              btn.textContent = '📋 Copy Message';
            }, 2000);
          }
        }
      });
    }
  }

  public async completeWorkflow(): Promise<void> {
    this.setButtonLoading('completeWorkflowBtn', true);
    this.setWorkflowStatus('Running complete Indian startup workflow...', 'info');

    try {
      const minFunding = localStorage.getItem('leadgen_minFunding') || '5';
      const maxCompanies = localStorage.getItem('leadgen_maxCompanies') || '30';

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
      const response: FilesResponse = await this.makeRequest('/api/files');
      
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
          <div class="file-category-header" data-toggle="category">
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
              <div class="file-date-header" data-toggle="date">
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
              <div class="file-item" data-filename="${file.name}">
                <div class="file-info">
                  <div class="file-name">${file.name}</div>
                  <div class="file-meta">${file.size} • ${this.formatDateTime(file.modified)}</div>
                </div>
                <div class="file-actions">
                  <button class="btn btn--outline btn--small download-btn" data-filename="${file.name}">
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

    // Add event listeners for dropdowns and file actions
    this.setupFileEventListeners(filesListElement);
  }

  private setupFileEventListeners(container: HTMLElement): void {
    // Toggle category dropdowns
    container.querySelectorAll('[data-toggle="category"]').forEach(header => {
      header.addEventListener('click', () => {
        const category = header.parentElement;
        if (category) {
          category.classList.toggle('collapsed');
        }
      });
    });

    // Toggle date dropdowns
    container.querySelectorAll('[data-toggle="date"]').forEach(header => {
      header.addEventListener('click', () => {
        const dateGroup = header.parentElement;
        if (dateGroup) {
          dateGroup.classList.toggle('collapsed');
        }
      });
    });

    // File preview clicks
    container.querySelectorAll('.file-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on download button
        if ((e.target as HTMLElement).closest('.download-btn')) {
          return;
        }
        const filename = item.getAttribute('data-filename');
        if (filename) {
          this.previewFile(filename);
        }
      });
    });

    // Download button clicks
    container.querySelectorAll('.download-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const filename = button.getAttribute('data-filename');
        if (filename) {
          this.downloadFile(filename);
        }
      });
    });
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
      const response: FilePreviewResponse = await this.makeRequest(`/api/view/${filename}`);
      
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


