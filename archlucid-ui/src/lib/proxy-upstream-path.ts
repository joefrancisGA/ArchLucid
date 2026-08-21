export type ProxyUpstreamPathResult =
  | { ok: true; path: string }
  | { ok: false };

function containsPercentEncodedPathSeparator(value: string): boolean {
  const lower = value.toLowerCase();

  return lower.includes("%2e") || lower.includes("%2f") || lower.includes("%5c");
}

function segmentDecodesToUnsafeTraversal(segment: string): boolean {
  if (containsPercentEncodedPathSeparator(segment)) {
    return true;
  }

  let working = segment;

  for (let decodePass = 0; decodePass < 4 && working.includes("%"); decodePass++) {
    let decoded: string;

    try {
      decoded = decodeURIComponent(working);
    } catch {
      return true;
    }

    if (decoded === working) {
      break;
    }

    if (
      decoded === "." ||
      decoded === ".." ||
      decoded.includes("/") ||
      decoded.includes("\\")
    ) {
      return true;
    }

    if (containsPercentEncodedPathSeparator(decoded)) {
      return true;
    }

    working = decoded;
  }

  return containsPercentEncodedPathSeparator(working);
}

function isUnsafeProxyPathSegment(segment: string): boolean {
  if (segment.length === 0 || segment === "." || segment === ".." || segment.includes("/") || segment.includes("\\")) {
    return true;
  }

  return segmentDecodesToUnsafeTraversal(segment);
}

/**
 * Joins catch-all proxy segments into a canonical upstream tail path.
 * Rejects dot-segment traversal so anonymous marketing auth posture cannot be widened via `..`.
 */
export function buildProxyUpstreamPath(pathSegments: readonly string[]): ProxyUpstreamPathResult {
  if (pathSegments.length === 0) {
    return { ok: true, path: "" };
  }

  for (const segment of pathSegments) {
    if (isUnsafeProxyPathSegment(segment)) {
      return { ok: false };
    }
  }

  const joined = pathSegments.join("/");
  const resolved = new URL(joined, "http://archlucid.invalid/").pathname.replace(/^\//, "");

  if (resolved.length === 0 || resolved.includes("..") || containsPercentEncodedPathSeparator(resolved)) {
    return { ok: false };
  }

  return { ok: true, path: resolved };
}
