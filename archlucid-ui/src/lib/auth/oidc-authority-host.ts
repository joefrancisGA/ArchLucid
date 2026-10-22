/**
 * Returns true when the OIDC authority URL hostname exactly matches an allowed host (case-insensitive).
 */
export function authorityHostnameMatches(
  authority: string,
  allowedHosts: readonly string[],
): boolean {
  const trimmed = authority.trim();

  if (trimmed.length === 0 || allowedHosts.length === 0) {
    return false;
  }

  let parsed: URL;

  try {
    parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
  } catch {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();

  return allowedHosts.some((host) => host.toLowerCase() === hostname);
}
