/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CUSTOM_SEARCH_API_KEY: string
  readonly VITE_GOOGLE_CUSTOM_SEARCH_ID: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
