// AI Startup Finder types and interfaces

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
  linkedin_connect_strategy?: string;
  personalized_message?: string;
}

export interface SimpleStartupFinderResponse {
  success: boolean;
  count: number;
  data: CompanyData[];
  last_modified?: string;
}

export interface NewStartupFinderResponse {
  success: boolean;
  count: number;
  data: Array<{
    ceo_linkedin: string | null;
    ceo_name: string;
    company_name: string;
    description: string;
    funding_stage: string;
    industry: string;
    linkedin_url: string | null;
    location: string;
    total_funding: number;
  }>;
  timestamp: string;
}

// Type for individual startup data from NewStartupFinderResponse
export type NewStartupData = NewStartupFinderResponse['data'][0];

// Interface for AI startup finder runs
export interface AIStartupRun {
  id: string;
  timestamp: string;
  response: NewStartupFinderResponse;
  params: any;
  name: string;
}

// Storage interface for AI runs
export interface AIRunsStorage {
  runs: AIStartupRun[];
  currentRunId?: string;
}

export interface LeadGenConfig {
  apiUrl?: string;
  maxStartups?: string;
}
