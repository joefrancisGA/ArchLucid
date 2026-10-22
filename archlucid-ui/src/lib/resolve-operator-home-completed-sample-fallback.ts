import { OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { getBuyerSafeReviewsTableLink } from "@/lib/buyer/buyer-safe-review-navigation";
import {
  isDemoSeededOverviewWorkspaceLabel,
  resolveDemoSeededOverviewSamplePackage,
  shouldInjectDemoSeededOverviewSample,
} from "@/lib/demo-seeded-overview";
import {
  getEffectiveBrowserProxyScopeHeaders,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import {
  isShowcaseSpineStaticPayloadActiveForRun,
  isStaticDemoPayloadFallbackEnabled,
} from "@/lib/operator/operator-static-demo";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

export type OperatorHomeCompletedSampleFallback = {
  readonly href: string;
  readonly label: string;
};

function resolveShowcaseStaticDemoFallback(): OperatorHomeCompletedSampleFallback {
  const link = getBuyerSafeReviewsTableLink(SHOWCASE_STATIC_DEMO_RUN_ID);

  return {
    href: link.href,
    label: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
  };
}

/**
 * Curated completed-sample link when tenant homepage settings have no featured pin —
 * aligned with Recent reviews injection and showcase spine eligibility.
 */
export function resolveOperatorHomeCompletedSampleFallback(): OperatorHomeCompletedSampleFallback | null {
  if (isStaticDemoPayloadFallbackEnabled()) {
    return resolveShowcaseStaticDemoFallback();
  }

  if (typeof window !== "undefined") {
    const scopeHeaders = getEffectiveBrowserProxyScopeHeaders();
    const workspaceLabel = readOperatorScopeFromStorage()?.workspaceLabel ?? null;

    if (
      shouldInjectDemoSeededOverviewSample({
        itemCount: 0,
        scopeHeaders,
        workspaceLabel,
        staticDemoFallbackEnabled: isStaticDemoPayloadFallbackEnabled(),
      }) ||
      isDemoSeededOverviewWorkspaceLabel(workspaceLabel)
    ) {
      const sample = resolveDemoSeededOverviewSamplePackage(scopeHeaders);

      return {
        href: sample.href,
        label: OPERATOR_HOME_OPEN_COMPLETED_REVIEW_CTA,
      };
    }
  }

  if (isShowcaseSpineStaticPayloadActiveForRun(SHOWCASE_STATIC_DEMO_RUN_ID)) {
    return resolveShowcaseStaticDemoFallback();
  }

  return null;
}
