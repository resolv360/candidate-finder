import { NewStartupFinderResponse, NewStartupData } from './types';
import { CSVExporter } from './csv-export';

export class UIManager {
  /**
   * Show toast notification
   */
  static showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // Remove any existing toasts first
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });

    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    // Initial hidden state
    toast.style.cssText = `
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `;

    // Add to body
    document.body.appendChild(toast);

    // Show toast with animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    // Auto-hide toast after 4 seconds
    setTimeout(() => {
      if (toast && toast.parentNode) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        
        // Remove from DOM after animation
        setTimeout(() => {
          if (toast && toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }
    }, 4000);
  }

  /**
   * Display startup results in table format
   */
  static displayStartupResults(response: NewStartupFinderResponse): void {
    const resultsContainer = document.getElementById('resultsContainer');
    
    if (!resultsContainer || !response.data || response.data.length === 0) {
      if (resultsContainer) {
        resultsContainer.innerHTML = '<p class="text-center text-secondary">No startups found</p>';
      }
      return;
    }

    // Display startup table with new data structure
    const startupTableHTML = `
      <div class="startup-info" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span>🔍 Found ${response.count} Indian startups • Last updated: ${new Date(response.timestamp).toLocaleString()}</span>
        <button type="button" class="btn btn--primary btn--sm" id="leadgenDownloadCsvBtn" style="margin-left: 16px;">
          📊 CSV
        </button>
      </div>
      <table class="startup-table">
        <thead class="startup-table-header">
          <tr>
            <th style="width: 18%;">Company</th>
            <th style="width: 12%;">CEO</th>
            <th style="width: 18%;">Industry</th>
            <th style="width: 12%;">Location</th>
            <th style="width: 8%;">Stage</th>
            <th style="width: 8%;">Funding (in millions)</th>
            <th style="width: 12%;">Profile</th>
            <th style="width: 12%;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${response.data.map((startup, index) => `
            <tr class="startup-table-row" data-startup-index="${index}">
              <td>
                <div class="startup-name">${startup.company_name}</div>
              </td>
              <td>
                <div class="founder-name">${startup.ceo_name}</div>
              </td>
              <td>
                <span class="industry-tag">${startup.industry}</span>
              </td>
              <td>
                <span class="location-tag">${startup.location}</span>
              </td>
              <td>
                <span class="funding-badge">${startup.funding_stage}</span>
              </td>
              <td>
                <span class="funding-amount">$${startup.total_funding?.toLocaleString() || '0'}</span>
              </td>
              <td>
                ${startup.linkedin_url ? 
                  `<a href="${startup.linkedin_url}" target="_blank" class="linkedin-link">View Profile</a>` : 
                  '<span class="text-muted">No Profile</span>'
                }
              </td>
              <td>
                <button type="button" class="btn btn--sm btn--outline copy-template-btn" data-startup-index="${index}">
                  📋 Copy Template
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    resultsContainer.innerHTML = startupTableHTML;

    // Add CSV download handler
    const downloadBtn = document.getElementById('leadgenDownloadCsvBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        try {
          console.log('CSV download clicked, data:', response.data);
          console.log('Number of startups:', response.data.length);
          
          if (!response.data || response.data.length === 0) {
            throw new Error('No startup data available for export');
          }
          
          CSVExporter.exportStartupsToCSV(response.data, 'indian_startups');
          this.showToast('✅ CSV downloaded successfully!', 'success');
        } catch (error) {
          console.error('Error downloading CSV:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.showToast(`❌ Failed to download CSV: ${errorMessage}`, 'error');
        }
      });
    } else {
      console.error('Leadgen Download CSV button not found');
    }

    // Add click handlers for table rows
    const startupRows = resultsContainer.querySelectorAll('.startup-table-row');
    startupRows.forEach((row: Element) => {
      row.addEventListener('click', async () => {
        // Remove selected class from all rows
        startupRows.forEach((r: Element) => r.classList.remove('selected'));
        // Add selected class to clicked row
        row.classList.add('selected');
        
        // Get the correct startup index from the data attribute
        const startupIndex = parseInt((row as HTMLElement).getAttribute('data-startup-index') || '0');
        console.log('Row clicked for startup index:', startupIndex);
        console.log('Startup data for row:', response.data[startupIndex]);
        
        // Fill and copy template
        await TemplateManager.fillAndCopyTemplate(response.data[startupIndex]);
      });
    });

    // Add click handlers for copy buttons
    const copyButtons = resultsContainer.querySelectorAll('.copy-template-btn');
    copyButtons.forEach((button: Element) => {
      button.addEventListener('click', async (e: Event) => {
        e.stopPropagation(); // Prevent row click
        
        // Get the correct startup index from the data attribute
        const startupIndex = parseInt((button as HTMLElement).getAttribute('data-startup-index') || '0');
        
        await TemplateManager.fillAndCopyTemplate(response.data[startupIndex]);
        
        // Visual feedback for button
        const btn = e.target as HTMLButtonElement;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copied!';
        btn.style.background = 'var(--color-success)';
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
        }, 2000);
      });
    });
  }
}

export class TemplateManager {
  /**
   * Fill template with startup data and copy to clipboard
   */
  static async fillAndCopyTemplate(startup: NewStartupData): Promise<void> {
    try {
      const templateTextarea = document.getElementById('leadgenTemplateTextarea') as HTMLTextAreaElement;
      
      if (!templateTextarea) {
        UIManager.showToast('❌ Template not found', 'error');
        return;
      }

      if (!templateTextarea.value.trim()) {
        UIManager.showToast('❌ Please enter a template message first', 'error');
        return;
      }

      // Fill template with variables
      let filledTemplate = templateTextarea.value;
      
      // Replace variables with actual data
      filledTemplate = filledTemplate.replace(/{founder_name}/g, startup.ceo_name || '');
      filledTemplate = filledTemplate.replace(/{company_name}/g, startup.company_name || '');
      filledTemplate = filledTemplate.replace(/{industry}/g, startup.industry || '');
      filledTemplate = filledTemplate.replace(/{location}/g, startup.location || '');
      filledTemplate = filledTemplate.replace(/{funding_amount}/g, startup.total_funding?.toString() || '');

      // Copy to clipboard
      await navigator.clipboard.writeText(filledTemplate);
      
      UIManager.showToast(`✅ Template copied! Message ready for ${startup.ceo_name} at ${startup.company_name}`, 'success');
    } catch (error) {
      console.error('Error filling template:', error);
      UIManager.showToast('❌ Failed to copy template', 'error');
    }
  }

  /**
   * Copy template without variables
   */
  static async copyTemplate(): Promise<void> {
    try {
      const templateTextarea = document.getElementById('leadgenTemplateTextarea') as HTMLTextAreaElement;
      
      if (!templateTextarea) {
        UIManager.showToast('❌ Template not found', 'error');
        return;
      }

      if (!templateTextarea.value.trim()) {
        UIManager.showToast('❌ Please enter a template message first', 'error');
        return;
      }

      await navigator.clipboard.writeText(templateTextarea.value);
      UIManager.showToast('✅ Template copied to clipboard!', 'success');
    } catch (error) {
      console.error('Error copying template:', error);
      UIManager.showToast('❌ Failed to copy template', 'error');
    }
  }

  /**
   * Add variable to template
   */
  static addVariableToTemplate(variable: string): void {
    const templateTextarea = document.getElementById('leadgenTemplateTextarea') as HTMLTextAreaElement;
    if (templateTextarea) {
      const cursorPos = templateTextarea.selectionStart;
      const textBefore = templateTextarea.value.substring(0, cursorPos);
      const textAfter = templateTextarea.value.substring(templateTextarea.selectionEnd);
      
      templateTextarea.value = textBefore + `{${variable}}` + textAfter;
      templateTextarea.focus();
      templateTextarea.setSelectionRange(cursorPos + variable.length + 2, cursorPos + variable.length + 2);
    }
    
    UIManager.showToast(`Added ${variable} to template`, 'success');
  }
}
