import { IRL_SLUG, SOURCE_REGISTRY } from '@/lib/coloringDictionaryBrand';

export type VcapSurface =
  | 'origin_html'
  | 'origin_llms'
  | 'origin_mcp'
  | 'origin_openapi'
  | 'origin_brand'
  | 'origin_book'
  | 'origin_discovery'
  | 'origin_jsonld'
  | 'irl_html'
  | 'irl_llms'
  | 'irl_mcp'
  | 'irl_openapi'
  | 'irl_jsonld'
  | 'signup_intent'
  | 'preview_open'
  | 'amazon_cta'
  | 'cart_add'
  | 'checkout_start'
  | 'checkout_success';

type AccessPayload = {
  sourceRegistry: string;
  slug: string;
  surface: VcapSurface;
  httpStatus: number;
  path: string;
  userAgent?: string;
  meta?: Record<string, string>;
};

/**
 * Fire-and-forget HITS recording.
 * Prefer `/api/vcap/hit` (Functions outbox → Big Search) so the API key never ships to the browser.
 * Falls back to a no-op when the endpoint is unavailable.
 */
export function recordVcapHit(
  surface: VcapSurface,
  path: string,
  meta?: Record<string, string>,
): void {
  const payload: AccessPayload = {
    sourceRegistry: SOURCE_REGISTRY,
    slug: IRL_SLUG,
    surface,
    httpStatus: 200,
    path,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    meta,
  };

  const body = JSON.stringify(payload);

  // Same-origin Functions handoff (preferred)
  void fetch('/api/vcap/hit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    /* offline / pre-deploy — ignore */
  });
}
