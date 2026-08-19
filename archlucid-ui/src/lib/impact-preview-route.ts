/** Canonical Impact preview (left-nav label); formerly `/evolution-review` (retired — no redirect). */
export const IMPACT_PREVIEW_PATH = "/insights/impact-preview" as const;

/** Retired pre-release path — no App Router page and no next.config redirect. */
export const LEGACY_EVOLUTION_REVIEW_PATH = "/evolution-review" as const;

export function isImpactPreviewPath(pathname: string): boolean {
  return pathname === IMPACT_PREVIEW_PATH || pathname.startsWith(`${IMPACT_PREVIEW_PATH}/`);
}

/** Builds Impact preview href with optional query. */
export function impactPreviewHref(query?: Record<string, string | undefined>): string {
  if (query === undefined) {
    return IMPACT_PREVIEW_PATH;
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  }

  const qs = params.toString();

  return qs.length > 0 ? `${IMPACT_PREVIEW_PATH}?${qs}` : IMPACT_PREVIEW_PATH;
}
