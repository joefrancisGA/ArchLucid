import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

export type GovernanceResolutionPageViewModel = {
  readonly canMutateEnterprisePolicySurfaces: boolean;
  readonly data: EffectiveGovernanceResolutionResult | null;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly load: () => Promise<void>;
};
