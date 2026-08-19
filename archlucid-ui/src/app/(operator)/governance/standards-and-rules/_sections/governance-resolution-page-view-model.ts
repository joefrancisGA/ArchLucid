import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { EffectiveGovernanceResolutionResult } from "@/types/governance-resolution";

/** Client view-model for {@link GovernanceResolutionPageView}; produced by {@link useGovernanceResolutionPage} after server hydration. */
export type GovernanceResolutionPageViewModel = {
  readonly buyerPolishedShell: boolean;
  readonly canMutateEnterprisePolicySurfaces: boolean;
  readonly data: EffectiveGovernanceResolutionResult | null;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly lastRefreshedAt: Date | null;
  readonly load: () => Promise<void>;
};
