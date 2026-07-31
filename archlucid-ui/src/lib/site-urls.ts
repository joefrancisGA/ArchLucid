/**
 * Cross-host URL helpers for the marketing (apex) vs operator (app) Container App split.
 * When public/app origins are unset or equal, hrefs stay relative so local single-host dev is unchanged.
 *
 * Runtime (preferred on Container Apps): ARCHLUCID_PUBLIC_SITE_URL / ARCHLUCID_APP_SITE_URL
 * Build-time fallback: NEXT_PUBLIC_ARCHLUCID_SITE_URL / NEXT_PUBLIC_ARCHLUCID_APP_SITE_URL
 */

function normalizeOrigin(raw: string | undefined | null): string | null {
  if (raw == null) return null;

  const trimmed = raw.trim();

  if (trimmed === "") return null;

  try {
    const normalized = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
    const url = new URL(normalized);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function readEnvOrigin(runtimeKey: string, publicKey: string): string | null {
  const runtime = normalizeOrigin(process.env[runtimeKey]);

  if (runtime != null) return runtime;

  return normalizeOrigin(process.env[publicKey]);
}

/** Marketing / apex origin (e.g. https://archlucid.net). Null when not configured. */
export function resolvePublicSiteOrigin(): string | null {
  return readEnvOrigin("ARCHLUCID_PUBLIC_SITE_URL", "NEXT_PUBLIC_ARCHLUCID_SITE_URL");
}

/** Operator / app origin (e.g. https://app.archlucid.net). Null when not configured. */
export function resolveAppSiteOrigin(): string | null {
  return readEnvOrigin("ARCHLUCID_APP_SITE_URL", "NEXT_PUBLIC_ARCHLUCID_APP_SITE_URL");
}

/** True when public and app origins are both set and differ (split hosting is live). */
export function isSplitSiteHostingEnabled(): boolean {
  const publicOrigin = resolvePublicSiteOrigin();
  const appOrigin = resolveAppSiteOrigin();

  if (publicOrigin == null || appOrigin == null) return false;

  return publicOrigin !== appOrigin;
}

function ensureLeadingSlash(path: string): string {
  if (path.startsWith("/")) return path;

  return `/${path}`;
}

/**
 * Path or absolute URL on the public marketing host.
 * Relative when split hosting is off or the path is already absolute.
 */
export function publicSiteHref(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const normalizedPath = ensureLeadingSlash(path);
  const publicOrigin = resolvePublicSiteOrigin();
  const appOrigin = resolveAppSiteOrigin();

  if (publicOrigin == null) return normalizedPath;

  if (appOrigin == null || publicOrigin === appOrigin) return normalizedPath;

  return `${publicOrigin}${normalizedPath}`;
}

/**
 * Path or absolute URL on the operator app host (sign-in, workspace).
 * Relative when split hosting is off or the path is already absolute.
 */
export function appSiteHref(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const normalizedPath = ensureLeadingSlash(path);
  const publicOrigin = resolvePublicSiteOrigin();
  const appOrigin = resolveAppSiteOrigin();

  if (appOrigin == null) return normalizedPath;

  if (publicOrigin == null || publicOrigin === appOrigin) return normalizedPath;

  return `${appOrigin}${normalizedPath}`;
}
