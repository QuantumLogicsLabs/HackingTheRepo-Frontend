/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_SECRETS_ENCRYPTION_KEY?: string;
  }
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
