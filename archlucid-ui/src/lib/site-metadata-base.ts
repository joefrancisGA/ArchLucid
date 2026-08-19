/**
 * Canonical site origin for absolute URLs in metadata (Open Graph, etc.).
 * Set in production via NEXT_PUBLIC_ARCHLUCID_SITE_URL (no trailing slash).
 */
export function getSiteMetadataBaseUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_ARCHLUCID_SITE_URL?.trim();

  if (raw) {
    try {
      const normalized = raw.endsWith("/") ? raw.slice(0, -1) : raw;

      return new URL(normalized);
    } catch {
      // Fall through to localhost default.
    }
  }

  return new URL("http://localhost:3000");
}
