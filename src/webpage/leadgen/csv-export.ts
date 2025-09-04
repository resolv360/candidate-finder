import { NewStartupData } from '../leadgen';

export interface CSVExportData {
  company_name: string;
  ceo_name: string;
  industry: string;
  location: string;
  funding_stage: string;
  total_funding: number;
  linkedin_url: string | null;
  ceo_linkedin: string | null;
  description: string;
}

export class CSVExporter {
  /**
   * Convert startup data to CSV format
   */
  static convertToCSV(startups: NewStartupData[]): string {
    if (!startups || startups.length === 0) {
      return '';
    }

    // Define CSV headers
    const headers = [
      'Company Name',
      'CEO Name', 
      'Industry',
      'Location',
      'Funding Stage',
      'Total Funding',
      'Company LinkedIn',
      'CEO LinkedIn',
      'Description'
    ];

    // Convert data to CSV rows
    const csvRows: string[] = [];
    
    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    startups.forEach((startup, index) => {
      const row = [
        this.escapeCsvField(startup.company_name || ''),
        this.escapeCsvField(startup.ceo_name || ''),
        this.escapeCsvField(startup.industry || ''),
        this.escapeCsvField(startup.location || ''),
        this.escapeCsvField(startup.funding_stage || ''),
        this.escapeCsvField(startup.total_funding?.toString() || ''),
        this.escapeCsvField(startup.linkedin_url || ''),
        this.escapeCsvField(startup.ceo_linkedin || ''),
        this.escapeCsvField(startup.description || '')
      ];
      const rowText = row.join(',');
      csvRows.push(rowText);
      
      // Debug log first few rows
      if (index < 3) {
        console.log(`CSV row ${index}:`, rowText);
      }
    });

    return csvRows.join('\n');
  }

  /**
   * Escape CSV field content
   */
  private static escapeCsvField(field: string): string {
    if (!field) return '""';
    
    // Convert to string and handle special characters
    const stringField = field.toString();
    
    // If field contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    
    return `"${stringField}"`;
  }

  /**
   * Download CSV file using data URL approach (Chrome extension compatible)
   */
  static downloadCSV(csvContent: string, filename: string = 'startups'): void {
    try {
      console.log('Creating CSV download using data URL approach...');
      
      // Create data URL
      const csvData = '\uFEFF' + csvContent; // Add BOM for proper encoding
      const dataUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvData);
      
      const fullFilename = `${filename}_${this.getTimestamp()}.csv`;
      console.log('Creating download link with filename:', fullFilename);
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fullFilename;
      link.style.display = 'none';
      
      console.log('Triggering download...');
      // Add to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Small delay before removing to ensure download starts
      setTimeout(() => {
        document.body.removeChild(link);
        console.log('CSV download completed and link cleaned up');
      }, 100);
      
    } catch (error) {
      console.error('Error downloading CSV:', error);
      throw new Error('Failed to download CSV file');
    }
  }

  /**
   * Get formatted timestamp for filename
   */
  private static getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    return `${year}${month}${day}_${hours}${minutes}`;
  }

  /**
   * Export startup data to CSV and download
   */
  static exportStartupsToCSV(startups: NewStartupData[], filename?: string): void {
    try {
      console.log('Starting CSV export with', startups.length, 'startups');
      
      if (!startups || startups.length === 0) {
        throw new Error('No startup data to export');
      }

      console.log('Converting to CSV...');
      const csvContent = this.convertToCSV(startups);
      console.log('CSV content length:', csvContent.length);
      console.log('CSV content preview:', csvContent.substring(0, 200) + '...');
      
      const exportFilename = filename || 'indian_startups';
      console.log('Attempting download with filename:', exportFilename);
      
      try {
        this.downloadCSV(csvContent, exportFilename);
        console.log('CSV export completed successfully');
      } catch (downloadError) {
        console.warn('Direct download failed, trying clipboard fallback:', downloadError);
        // Fallback: copy to clipboard
        this.copyCSVToClipboard(csvContent);
        throw new Error('Direct download failed. CSV data copied to clipboard instead. Please paste into a text file and save as .csv');
      }
    } catch (error) {
      console.error('Error exporting startups to CSV:', error);
      throw error;
    }
  }

  /**
   * Fallback: Copy CSV content to clipboard
   */
  static async copyCSVToClipboard(csvContent: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(csvContent);
      console.log('CSV content copied to clipboard');
    } catch (error) {
      console.error('Failed to copy CSV to clipboard:', error);
      throw new Error('Failed to export CSV data');
    }
  }

  /**
   * Test CSV generation with sample data (for debugging)
   */
  static testCSVGeneration(): void {
    const testData: NewStartupData[] = [
      {
        ceo_linkedin: 'https://linkedin.com/in/test',
        ceo_name: 'John Doe',
        company_name: 'Test Corp',
        description: 'A test company',
        funding_stage: 'Series A',
        industry: 'Technology',
        linkedin_url: 'https://linkedin.com/company/test',
        location: 'Mumbai',
        total_funding: 1000000
      }
    ];
    
    try {
      console.log('Testing CSV generation...');
      const csv = this.convertToCSV(testData);
      console.log('Test CSV output:', csv);
      this.downloadCSV(csv, 'test');
    } catch (error) {
      console.error('CSV test failed:', error);
    }
  }
}

// Expose CSVExporter for debugging in browser console (leadgen scope)
(window as any).LeadgenCSVExporter = CSVExporter;
