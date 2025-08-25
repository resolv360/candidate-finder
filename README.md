## Installation & Setup

### Building the extension
Run the following in this root directory
```sh
npm install
npm run build
```

### Get API Keys & project
- GOOGLE_CUSTOM_SEARCH_API_KEY: https://developers.google.com/custom-search/v1/overview#api_key
- GEMINI_API_KEY: https://aistudio.google.com/
- GOOGLE_CUSTOM_SEARCH_ID: https://programmablesearchengine.google.com/controlpanel/all (add here and copy the "cx")

### Loading the extension into the browser
1. Open "chrome://extensions/" in any latest chromium based browser.
2. Enable developer mode (mostly in right top corner in same page)
3. Click on "Load unpacked" button and select this root directory

> Usage: Just click on the extension to start using it.
> In candidate listing on the extension page, use Ctrl+Click to open in background tabs. Or use "Open next 5" button to open next 5 of them in background.

## Template Usage
Eg template:
```
Hi [Name],
Content.
More content.
```

> "[Name]" will be replaced by the candidate's name

## Points to note
There are lots edge cases that the extension may fail, so follow the below
- don't open the extension in multiple tabs, open only on one tab
