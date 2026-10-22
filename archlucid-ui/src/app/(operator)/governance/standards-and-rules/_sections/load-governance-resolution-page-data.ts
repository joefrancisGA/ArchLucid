import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { getGovernanceResolution } from "@/lib/api";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

export type GovernanceResolutionPageServerLoad = {
  readonly data: EffectiveGovernanceResolutionResult | null;
  readonly failure: ApiLoadFailureState | null;
};

export async function loadGovernanceResolutionPageData(): Promise<GovernanceResolutionPageServerLoad> {
  try {
    const data: EffectiveGovernanceResolutionResult = await getGovernanceResolution();

    return { data, failure: null };
  } catch (e: unknown) {
    return { data: null, failure: toApiLoadFailure(e) };
  }
}
