import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchPolicyPacksPageBundle } from "@/lib/api";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  mergePolicyPacksStateWithStaticDemo,
  staticDemoPolicyPacksFallbackBundle,
} from "@/lib/operator/operator-static-demo";
import type {
  EffectivePolicyPackSet,
  PolicyPack,
  PolicyPackContentDocument,
} from "@/types/policy-packs";

/** Initial packs row set + merge outcome from server `GET` trio; lifecycle/version rows stay client-driven. */
export type PolicyPacksPageServerLoad = {
  readonly packs: PolicyPack[];
  readonly effective: EffectivePolicyPackSet | null;
  readonly effectiveContent: PolicyPackContentDocument | null;
  readonly failure: ApiLoadFailureState | null;
};

export async function loadPolicyPacksPageData(): Promise<PolicyPacksPageServerLoad> {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  try {
    const bundle = await fetchPolicyPacksPageBundle();
    const merged = mergePolicyPacksStateWithStaticDemo(
      bundle.packs,
      bundle.effective,
      bundle.effectiveContent,
      "default",
      {
        afterEmptyLiveResponse:
          buyerPolishedShell ||
          (bundle.packs.length === 0 && (bundle.effective === null || bundle.effective.packs.length === 0)),
      },
    );

    return {
      packs: merged.packs,
      effective: merged.effective,
      effectiveContent: merged.content,
      failure: null,
    };
  } catch (e: unknown) {
    const fb = staticDemoPolicyPacksFallbackBundle("default", { afterAuthorityFailure: true });

    if (fb !== null) {
      return {
        packs: fb.packs,
        effective: fb.effective,
        effectiveContent: fb.content,
        failure: null,
      };
    }

    return {
      packs: [],
      effective: null,
      effectiveContent: null,
      failure: toApiLoadFailure(e),
    };
  }
}
