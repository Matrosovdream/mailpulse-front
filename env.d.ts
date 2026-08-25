/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the MailPulse API, no trailing slash. e.g. http://localhost:3000 */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
