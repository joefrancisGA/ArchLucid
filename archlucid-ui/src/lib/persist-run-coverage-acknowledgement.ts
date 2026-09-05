import { putRunCoverageAcknowledgement } from "@/lib/api/run-coverage-api";
import {
  clearSessionCoveragePackOverrides,
  getSessionCoveragePackOverrides,
  toRunCoverageAcknowledgementEntries,
} from "@/lib/coverage-pack-overrides";

/** Persists wizard session exclusions when present; safe to call with zero overrides. */
export async function persistSessionRunCoverageAcknowledgement(runId: string): Promise<void> {
  const entries = toRunCoverageAcknowledgementEntries(getSessionCoveragePackOverrides());

  if (entries.length === 0) {
    clearSessionCoveragePackOverrides();

    return;
  }

  await putRunCoverageAcknowledgement(runId, entries);
  clearSessionCoveragePackOverrides();
}
