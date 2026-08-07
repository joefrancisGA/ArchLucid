import { normalizeTelemetryRoute } from "./telemetry-route-normalizer";

/**
 * Collapses API proxy upstream paths for log/metric cardinality
 * (e.g. v1/architecture/review/{guid}/execute → v1/architecture/review/[id]/execute).
 */
export function normalizeProxyPathForTelemetry(upstreamPath: string): string {
  const trimmed = upstreamPath.trim();

  if (trimmed.length === 0 || trimmed === "_") {
    return "_";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  return normalizeTelemetryRoute(withLeadingSlash).replace(/^\//, "") || "_";
}
