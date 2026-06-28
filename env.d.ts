/// <reference types="vite/client" />

interface ImportMetaEnv {
  // No client-side env vars needed — all secrets are server-side (Vercel env)
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
