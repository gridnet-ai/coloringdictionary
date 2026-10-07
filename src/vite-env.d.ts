/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID: string;
  readonly VITE_SITE_ORIGIN: string;
  readonly VITE_SOURCE_REGISTRY: string;
  readonly VITE_IRL_SLUG: string;
  readonly VITE_REGISTRY_ACCESS_URL?: string;
  readonly VITE_CLARITY_PROJECT_ID?: string;
  readonly VITE_OWNER_EMAILS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
