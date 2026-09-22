import { apiPostJson } from "@/lib/api/http";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { pilotCloseoutMutationBlockedReason } from "@/lib/pilots/pilot-closeout-mutation-blocked-reason";

export type PilotCloseoutPostBody = {
  readonly runId: string;
  readonly baselineHours?: number | null;
  readonly speedScore: number;
  readonly manifestPackageScore: number;
  readonly traceabilityScore: number;
  readonly notes?: string | null;
};

/** Records pilot closeout metrics for one review (`POST /v1/pilots/closeout`). */
export async function postPilotCloseout(body: PilotCloseoutPostBody): Promise<{ closeoutId: string }> {
  try {
    return await apiPostJson<{ closeoutId: string }>("/v1/pilots/closeout", body);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blocked = pilotCloseoutMutationBlockedReason(failure);

    throw new Error(blocked ?? failure.message);
  }
}
