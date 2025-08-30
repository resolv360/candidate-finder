# 🇮🇳 Indian Startup Lead Generation API Documentation

## Overview
This API specializes in extracting funding data from Indian startup news sources with LinkedIn connect message strategies. It focuses specifically on YourStory, Entrackr, and Inc42 to find the most comprehensive Indian startup funding information.

## Base URL
```
http://localhost:5000
```

## Features
- ✅ **Indian-focused scraping** from YourStory, Entrackr, Inc42
- ✅ **Configurable funding filters** (minimum amount in millions USD)
- ✅ **Company limit settings** for controlled data extraction
- ✅ **LinkedIn connect message generation** with personalized strategies
- ✅ **Enhanced funding amount detection** (USD, INR, Crores, Lakhs)
- ✅ **Real-time article scraping** from multiple Indian sources
- ✅ **Comprehensive data enrichment** with founder LinkedIn detection

## Authentication
Currently no authentication required for local development.

---

## API Endpoints

### 1. Complete Indian Startup Workflow
**POST** `/api/workflow/complete`

Runs the complete extraction and enrichment workflow for Indian startups.

**Request Body:**
```json
{
  "min_funding_millions": 5,    // Minimum funding in USD millions (default: 5)
  "max_companies": 30           // Maximum companies to extract (default: 30)
}
```

**Response:**
```json
{
  "status": "success",
  "companies_found": 25,
  "indian_companies": 25,
  "companies_with_linkedin_strategy": 25,
  "settings_used": {
    "min_funding_millions": 5,
    "max_companies": 30
  },
  "files": [
    "complete_workflow_20250830_123456.json",
    "crm_export_20250830_123456.csv", 
    "report_20250830_123456.txt"
  ],
  "timestamp": "2025-08-30T12:34:56.789",
  "message": "Found 25 companies (25 Indian) with LinkedIn strategies"
}
```

### 2. Extract Indian Companies
**POST** `/api/extract`

Extract funding data from Indian startup sources with configurable settings.

**Request Body:**
```json
{
  "min_funding_millions": 10,   // Filter companies by minimum funding
  "max_companies": 50           // Maximum companies to process
}
```

**Response:**
```json
{
  "status": "success",
  "articles_processed": 100,
  "companies_extracted": 35,
  "indian_companies": 35,
  "companies_with_funding_amount": 28,
  "settings_used": {
    "min_funding_millions": 10,
    "max_companies": 50
  },
  "output_files": ["outputs/data/funding_data_[timestamp].json"],
  "message": "Extracted 35 companies (35 Indian) from YourStory, Entrackr, Inc42",
  "sources": ["YourStory", "Entrackr", "Inc42"]
}
```

### 3. Get Indian Funding Articles
**GET** `/api/articles`

Retrieve the latest funding articles from Indian startup news sources.

**Response:**
```json
{
  "status": "success",
  "articles_found": 85,
  "articles_with_funding_amount": 45,
  "sources": ["YourStory", "Entrackr", "Inc42"],
  "articles": [
    {
      "title": "Bengaluru-based fintech startup raises $25M Series A",
      "url": "https://yourstory.com/funding/startup-25m-series-a",
      "source": "YourStory",
      "is_india_focused": true,
      "funding_amount": "$25M",
      "scraped_at": "2025-08-30T12:34:56.789"
    }
  ],
  "message": "Found 85 Indian startup funding articles"
}
```

### 4. Get Latest Output
**GET** `/api/latest-output`

Retrieve the most recent workflow output with complete company data including LinkedIn strategies.

**Response:**
```json
{
  "status": "success",
  "filename": "complete_workflow_20250830_123456.json",
  "last_modified": "2025-08-30T12:34:56.789",
  "data": [
    {
      "company_name": "TechStartup India",
      "funding_amount": "$15M",
      "funding_round": "Series A",
      "company_industry": "FinTech",
      "company_headquarters": "Bangalore, India",
      "ceo_name": "Rajesh Kumar",
      "linkedin_connect_strategy": {
        "primary_message": "Hi Rajesh! Congratulations on TechStartup India's recent Series A funding of $15M! I'm impressed by your work in FinTech. Would love to connect and learn more about your journey building TechStartup India.",
        "alternative_messages": [
          "Hello Rajesh! Saw the exciting news about TechStartup India's Series A round ($15M). As someone interested in the FinTech space, I'd love to connect and follow your startup's growth story.",
          "Hi Rajesh! Congratulations on the recent funding success for TechStartup India! Your work in FinTech caught my attention. I'd love to connect and potentially explore ways to support your startup's growth."
        ],
        "message_tips": [
          "Keep it under 300 characters for LinkedIn mobile app",
          "Mention specific details about their recent funding to show genuine interest",
          "Focus on learning and potential collaboration rather than direct selling"
        ],
        "best_time_to_connect": "Tuesday-Thursday, 9-11 AM or 2-4 PM IST",
        "follow_up_strategy": {
          "day_1": "Send connection request with personalized message",
          "day_3": "If accepted, send congratulatory message about the funding",
          "week_1": "Share relevant industry article or insight",
          "week_2": "Offer specific value (introduction, partnership, etc.)"
        }
      }
    }
  ]
}
```

### 5. List Generated Files
**GET** `/api/files`

Get a list of all generated output files.

**Response:**
```json
{
  "status": "success",
  "files": [
    {
      "name": "complete_workflow_20250830_123456.json",
      "type": "data",
      "size": "245KB",
      "modified": "2025-08-30T12:34:56.789"
    }
  ],
  "total": 5
}
```

### 6. Download Files
**GET** `/api/download/{filename}`

Download a specific generated file.

### 7. Health Check
**GET** `/api/health`

Check API health status.

## Data Structure

### Company Data Fields
Each extracted company includes:

```json
{
  "company_name": "string",
  "company_website": "string", 
  "company_description": "string",
  "company_industry": "string",
  "company_headquarters": "string",
  "funding_amount": "string",
  "funding_round": "string", 
  "funding_date": "string",
  "investors": "array",
  "ceo_name": "string",
  "source_title": "string",
  "source_url": "string",
  "source_website": "string",
  "is_india_focused": true,
  "scraped_at": "timestamp",
  
  // Enhanced LinkedIn Features
  "linkedin_connect_strategy": {
    "primary_message": "string",
    "alternative_messages": ["string"],
    "message_tips": ["string"],
    "best_time_to_connect": "string",
    "follow_up_strategy": {
      "day_1": "string",
      "day_3": "string", 
      "week_1": "string",
      "week_2": "string"
    }
  },
  "founder_linkedin_profiles": [
    {
      "name": "string",
      "title": "string", 
      "url": "string",
      "location": "string"
    }
  ],
  "ceo_linkedin": "string",
  "company_linkedin": "string"
}
```

## Configuration Options

### Funding Filters
- **min_funding_millions**: Filter companies by minimum funding amount (default: 5)
  - Supports USD millions, INR crores, lakhs conversion
  - Set to 0 to include all companies regardless of funding amount

### Company Limits  
- **max_companies**: Maximum number of companies to extract (default: 30)
  - Controls processing time and output size
  - Recommended range: 5-100

### Sources Covered
1. **YourStory** - Primary Indian startup news source
   - `/funding`, `/tag/startup-funding`, `/tag/series-a`, etc.
   - Covers seed to late-stage funding
   
2. **Entrackr** - Indian startup funding tracker
   - `/category/funding/`, `/tag/series-a/`, etc.
   - Detailed funding analytics and reports

3. **Inc42** - Indian startup ecosystem coverage
   - `/buzz/`, `/tag/funding/`, `/tag/venture-capital/`, etc.
   - Comprehensive startup news and funding data

## LinkedIn Connect Strategy Features

### Personalized Messages
- Uses company name, funding amount, industry, and CEO name
- Multiple message templates for different scenarios
- Professional tone focused on learning and collaboration

### Timing Recommendations
- Best times to connect: Tuesday-Thursday, 9-11 AM or 2-4 PM IST
- Considers Indian business hours and LinkedIn activity patterns

### Follow-up Strategy
- Day 1: Initial connection request
- Day 3: Congratulatory message if accepted
- Week 1: Share relevant industry content
- Week 2: Offer specific value or partnership opportunities

## Usage Examples

### Frontend Interface
Access the interactive frontend at: `http://localhost:5000`

### API Testing
```bash
# Get Indian funding articles
curl http://localhost:5000/api/articles

# Run complete workflow with custom settings
curl -X POST http://localhost:5000/api/workflow/complete \
  -H "Content-Type: application/json" \
  -d '{"min_funding_millions": 10, "max_companies": 25}'

# Extract companies with specific criteria
curl -X POST http://localhost:5000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"min_funding_millions": 5, "max_companies": 50}'

# Get latest results
curl http://localhost:5000/api/latest-output
```

## Response Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (no data or file not found)
- `500` - Internal Server Error
- `503` - Service Unavailable (missing dependencies)

## Rate Limiting
The API implements respectful rate limiting:
- 1-2 seconds between requests to each source
- Maximum 50 companies per workflow run
- Designed to be respectful to source websites

## Output Files
Generated files are saved in organized directories:
- `/outputs/data/` - JSON data files
- `/outputs/reports/` - Text reports  
- `/outputs/crm_exports/` - CSV files for CRM import

## LinkedIn Connect Message Guidelines
- Keep messages under 300 characters for mobile compatibility
- Always mention specific funding details to show genuine interest
- Focus on learning and collaboration rather than direct sales
- Include follow-up value proposition
- Respect Indian business culture and communication styles

---

**Note**: This API is designed specifically for Indian startup lead generation and includes extensive LinkedIn outreach strategy features. All data is focused on Indian companies and includes proper cultural context for business development in the Indian market.

---

### 5. List Files

**Endpoint:** `GET /api/files`

**Description:** List all available output files.

**Response:**
```json
{
  "status": "success",
  "files": [
    {
      "name": "funding_articles.json",
      "size": "2.5MB",
      "modified": "2024-01-15T09:30:00Z"
    },
    {
      "name": "enriched_companies.json",
      "size": "1.8MB",
      "modified": "2024-01-15T10:15:00Z"
    }
  ],
  "total_files": 2
}
```

---

### 6. Download File

---

### 7. Download File

**Endpoint:** `GET /api/download/<filename>`

**Description:** Download a specific output file.

**Example:** `GET /api/download/enriched_companies.json`

**Response:** 
- **Success:** File download with appropriate headers
- **Error 404:** File not found

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200:** Success
- **400:** Bad Request (missing required fields)
- **404:** Not Found (file doesn't exist)
- **500:** Internal Server Error

Error Response Format:
```json
{
  "error": "Description of the error"
}
```

---

## Setup Requirements

### Dependencies
Install required packages:
```bash
pip install -r requirements.txt
```

---

## Usage Examples

### Complete Workflow
```bash
# 1. Extract data
curl -X POST http://localhost:5000/api/extract \
  -H "Content-Type: application/json" \
  -d '{"sources": ["techcrunch"], "limit": 5}'

# 2. Enrich data  
curl -X POST http://localhost:5000/api/enrich \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Get latest output
curl http://localhost:5000/api/latest-output

# 4. Download specific file
curl -O http://localhost:5000/api/download/comprehensive_funding_data.json
```

### Get Latest Workflow Data
```bash
curl http://localhost:5000/api/latest-output
```

---

## Running the API

1. **Activate Virtual Environment:**
   ```bash
   source venv/bin/activate
   ```

2. **Start the Server:**
   ```bash
   cd api
   python simple_app.py
   ```

3. **Access the API:**
   ```
   http://localhost:5000
   ```

---

## File Storage

All output files are saved in the `outputs/` directory at the root level:
- `outputs/funding_articles.json` - Raw scraped articles
- `outputs/extracted_companies.json` - Extracted company data
- `outputs/enriched_companies.json` - Enriched with contact info
- `outputs/research_<company>.json` - Individual company research
- `outputs/batch_research_results.json` - Batch research results
- `outputs/contacts_export.csv` - CRM-ready contact export

---

## Notes

- The API runs on `localhost:5000` by default
- CORS is enabled for frontend integration
- All file paths are relative to the project root
- Error handling includes detailed error messages
- Research functionality requires Google API credentials
- Rate limiting may apply based on Google API quotas
