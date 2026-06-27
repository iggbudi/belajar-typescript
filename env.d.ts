/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_USERNAME: string;
  readonly VITE_ADMIN_PASSWORD: string;
  readonly VITE_TURSO_URL: string;
  readonly VITE_TURSO_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
