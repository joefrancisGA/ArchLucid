import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { PolicyPack } from "@/types/policy-packs";

import type { PolicyPacksPageTab } from "./policy-packs-page-view-model";

export type PolicyPacksAuthoringDeps = {
  readonly canMutatePacks: boolean;
  readonly packs: PolicyPack[];
  readonly packIdFromUrl: string;
  readonly pageTabFromUrl: PolicyPacksPageTab;
  readonly pageTab: PolicyPacksPageTab;
  readonly setPageTab: (tab: PolicyPacksPageTab) => void;
  readonly load: () => Promise<void>;
  readonly setLoading: (loading: boolean) => void;
  readonly setFailure: (failure: ApiLoadFailureState | null) => void;
};
