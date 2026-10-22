/**
 * Founder UI acceptance target (GTM M-96).
 * Canonical: ACCEPTANCE_BASE_URL. Alias: STAGING_BASE_URL (trial-funnel / hosted probes).
 */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** UI origin under test for `playwright.founder.config.ts` and remote Lighthouse. */
export function resolveAcceptanceBaseUrl(): string {
  const acceptance = process.env.ACCEPTANCE_BASE_URL?.trim();

  if (acceptance) {
    return stripTrailingSlash(acceptance);
  }

  const staging = process.env.STAGING_BASE_URL?.trim();

  if (staging) {
    return stripTrailingSlash(staging);
  }

  // Same default as live Playwright so local founder runs need no env when iterating.
  return "http://127.0.0.1:3000";
}

/** Optional Playwright storageState path (cookies/localStorage) — never commit authenticated dumps. */
export function resolveAcceptanceStorageState(): string | undefined {
  const path = process.env.ACCEPTANCE_STORAGE_STATE?.trim();

  if (!path) {
    return undefined;
  }

  return path;
}

export function isLoopbackAcceptanceTarget(baseUrl: string): boolean {
  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();

    return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "[::1]" || hostname === "::1";
  } catch {
    return false;
  }
}
