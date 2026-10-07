import Clarity from '@microsoft/clarity';

const PROJECT_ID =
  (import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined)?.trim() ||
  'yu20t0k9dh';

let started = false;

/** Microsoft Clarity session recordings + heatmaps. Safe to call once at app boot. */
export function initClarity(): void {
  if (started || typeof window === 'undefined') return;
  if (!PROJECT_ID) return;
  Clarity.init(PROJECT_ID);
  started = true;
}
