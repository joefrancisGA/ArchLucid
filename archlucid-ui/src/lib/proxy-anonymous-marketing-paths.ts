/** Upstream paths that must not receive the server-side proxy bearer token (TB-895). */
export function isAnonymousMarketingProxyPath(proxyPath: string): boolean {
  const normalized = proxyPath.trim().toLowerCase();

  if (normalized.length === 0) {
    return false;
  }

  return (
    normalized === "v1/marketing/quick-scan" ||
    normalized.startsWith("v1/marketing/quick-scan/") ||
    normalized === "v1/marketing/pricing/quote-request"
  );
}
