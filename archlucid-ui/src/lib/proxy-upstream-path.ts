export type ProxyUpstreamPathResult =
  | { ok: true; path: string }
  | { ok: false };

/**
 * Joins catch-all proxy segments into a canonical upstream tail path.
 * Rejects dot-segment traversal so anonymous marketing auth posture cannot be widened via `..`.
 */
export function buildProxyUpstreamPath(pathSegments: readonly string[]): ProxyUpstreamPathResult {
  if (pathSegments.length === 0) {
    return { ok: true, path: "" };
  }

  for (const segment of pathSegments) {
    if (segment.length === 0 || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\")) {
      return { ok: false };
    }
  }

  const joined = pathSegments.join("/");
  const resolved = new URL(joined, "http://archlucid.invalid/").pathname.replace(/^\//, "");

  if (resolved.length === 0 || resolved.includes("..")) {
    return { ok: false };
  }

  return { ok: true, path: resolved };
}
