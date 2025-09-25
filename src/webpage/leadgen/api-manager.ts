import { NewStartupFinderResponse } from './types';

export class APIManager {
  /**
   * Find Indian startups using AI
   */
  static async findIndianStartups(maxStartups: number = 10): Promise<NewStartupFinderResponse> {
    try {
      // Get API URL from settings with fallback
      const apiUrl = localStorage.getItem('leadgen_apiUrl') || 'http://localhost:5000';
      console.log('Using API URL:', apiUrl);
      
      const response = await fetch(`${apiUrl}/api/startups?max_companies=${maxStartups}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to find startups');
      }

      return data as NewStartupFinderResponse;
    } catch (error) {
      console.error('Error finding Indian startups:', error);
      throw error;
    }
  }

  /**
   * Test API connection
   */
  static async testConnection(apiUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error testing API connection:', error);
      return false;
    }
  }
}
