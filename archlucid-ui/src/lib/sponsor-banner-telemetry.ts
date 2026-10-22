import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

const allowedBuckets = new Set<string>(["0", "1-3", "4-7", "8-30", "30+"]);

/** Maps integer day count to low-cardinality telemetry bucket (matches API validation). */
export function bucketDaysSinceFirstCommit(dayN: number): string {
  if (dayN <= 0) {
    return "0";
  }

  if (dayN <= 3) {
    return "1-3";
  }

  if (dayN <= 7) {
    return "4-7";
  }

  if (dayN <= 30) {
    return "8-30";
  }

  return "30+";
}

/**
 * Fire-and-forget POST to record sponsor-banner badge render. Never throws; ignores non-OK responses.
 */
export function recordSponsorBannerFirstCommitBadge(dayN: number): void {
  if (typeof window === "undefined") {
    return;
  }

  const bucket: string = bucketDaysSinceFirstCommit(dayN);

  if (!allowedBuckets.has(bucket)) {
    return;
  }

  void fetch(
    "/api/proxy/v1/diagnostics/sponsor-banner-first-commit-badge",
    mergeRegistrationScopeForProxy({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ daysSinceFirstCommitBucket: bucket }),
      keepalive: true,
    }),
  ).catch(() => {
    /* intentional: telemetry must not surface secondary failures */
  });
}
