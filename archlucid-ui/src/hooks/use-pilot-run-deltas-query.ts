"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";
import { pilotRunDeltasBlockedReason } from "@/lib/pilots/pilot-run-deltas-blocked-reason";
import { fetchPilotRunDeltas } from "@/lib/pilots/pilot-run-deltas-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UsePilotRunDeltasQueryOptions = {
  readonly enabled?: boolean;
};

/** Maps pilot run-deltas GET failures to operator-facing sealed-hash copy when applicable. */
export function resolvePilotRunDeltasQueryErrorMessage(error: unknown): string {
  const failure = toApiLoadFailure(error);

  return pilotRunDeltasBlockedReason(failure) ?? failure.message;
}

/**
 * Persisted proof signals for one review, shared by every surface that gates a sponsor send.
 *
 * Keyed by operator scope as well as run id, so switching workspace never reuses a payload the
 * new scope may not be entitled to read.
 */
export function usePilotRunDeltasQuery(runId: string, options?: UsePilotRunDeltasQueryOptions) {
  const scope = useOperatorScopeQueryKey();

  return useQuery<PilotRunDeltasProofSummaryJson>({
    queryKey: operatorQueryKeys.pilotRunDeltas(scope, runId),
    queryFn: () => fetchPilotRunDeltas(runId),
    enabled: (options?.enabled ?? true) && runId.trim().length > 0,
  });
}
