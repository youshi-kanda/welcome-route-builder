/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_API_URL: string
  readonly VITE_TWILIO_ACCOUNT_SID?: string
  readonly VITE_TWILIO_AUTH_TOKEN?: string
  readonly VITE_TWILIO_PHONE_NUMBER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
