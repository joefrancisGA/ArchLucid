import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

/**
 * Reads persisted proof signals for one review (`GET /v1/pilots/runs/{runId}/pilot-run-deltas`).
 *
 * Throws on a failed request instead of resolving null: every caller renders an explicit
 * "proof unavailable" state, and a null payload already means "run has no persisted signals yet".
 * `no-store` keeps a sponsor-send decision off a browser-cached copy of an earlier attempt.
 */
export async function fetchPilotRunDeltas(runId: string): Promise<PilotRunDeltasProofSummaryJson> {
  const response = await fetch(
    `/api/proxy/v1/pilots/runs/${encodeURIComponent(runId)}/pilot-run-deltas`,
    mergeRegistrationScopeForProxy({
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
  );

  if (!response.ok) {
    throw new Error(`pilot-run-deltas request failed with status ${response.status}.`);
  }

  return (await response.json()) as PilotRunDeltasProofSummaryJson;
}
