import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import type { SponsorRoiSummary } from "@/lib/sponsor/sponsor-summary-markdown";

/** Most recently committed finalized review run id from sponsor dashboard summary. */
export function resolveSponsorDashboardLatestFinalizedRunId(
  summary: SponsorRoiSummary | null | undefined,
): string | null {
  let latestRunId: string | null = null;
  let latestCommitMs = Number.NEGATIVE_INFINITY;

  for (const system of summary?.systems ?? []) {
    const runId = system.runId.trim();
    const committedMs = parseIsoUtcMs(system.committedUtc ?? "");

    if (runId.length > 0 && committedMs > latestCommitMs) {
      latestRunId = runId;
      latestCommitMs = committedMs;
    }
  }

  return latestRunId;
}
