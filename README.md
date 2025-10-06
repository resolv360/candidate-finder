# Candidate Finder

A powerful candidate search and management tool that helps you organize and track potential candidates across workspaces.

## Features
- 🔍 AI-powered candidate search using Google Custom Search
- 📁 Organize candidates in multiple workspaces
- 🤖 Generate search queries automatically using Gemini AI
- � Duplicate workspaces to rerun searches without re-entering data
- ➕ Get more candidates for existing workspaces
- 🎯 Automatic deduplication - no duplicate candidates across searches
- �📊 Export candidates to CSV
- 💬 Template-based messaging system
- 🚀 AI Startup Finder for lead generation

## Key Features

### 🔄 Workspace Reuse
- **Duplicate Workspace**: Click 🔄 next to any workspace to create a copy with fresh candidates
- **Get More Candidates**: Expand existing workspaces with additional unique candidates
- **No Re-typing**: Reuses job descriptions, candidate counts, and templates

### 🎯 Smart Deduplication
- Automatically filters out duplicate candidates
- Works across duplicate workspaces and "Get More" operations
- Continues searching until unique candidates are found
- See [DEDUPLICATION.md](./DEDUPLICATION.md) for details

## Installation & Setup

### Building the extension
Run the following in this root directory
```sh
npm install
npm run dev
```

### Get API Keys & project
- GOOGLE_CUSTOM_SEARCH_API_KEY: https://developers.google.com/custom-search/v1/overview#api_key
- GEMINI_API_KEY: https://aistudio.google.com/
- GOOGLE_CUSTOM_SEARCH_ID: https://programmablesearchengine.google.com/controlpanel/all (add here and copy the "cx")