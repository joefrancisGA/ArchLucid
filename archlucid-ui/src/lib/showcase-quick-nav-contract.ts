import {
  isDemoRunIdEligibleForStaticFallback,
  isOperatorDemoStaticMode,
} from "@/lib/operator/operator-static-demo";
import { isShowcaseStaticFirstRunId } from "@/lib/showcase-page-resolution";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";

export const SHOWCASE_QUICK_NAV_HEADING = "Explore in workspace";

export const SHOWCASE_QUICK_NAV_DEEP_LINK_BODY =
  "Same scenario as this public preview — open the review, sealed record, or a finding.";

export const SHOWCASE_QUICK_NAV_SIGN_IN_BODY =
  "The full workspace view requires sign-in. You can continue with the same illustrative scenario after authentication.";

export const SHOWCASE_QUICK_NAV_SIGN_IN_CTA = "Sign in to explore workspace";

function isKnownShowcaseRunId(runId: string): boolean {
  const trimmed = runId.trim();

  return isShowcaseStaticFirstRunId(trimmed) || isDemoRunIdEligibleForStaticFallback(trimmed);
}

/**
 * Whether an anonymous showcase visitor can open operator deep links without hitting an auth trap.
 * Packaged demo env flags only — buyer-polished default production shell still requires sign-in (TB-890).
 */
export function canShowcaseAnonymousVisitorOpenOperatorDeepLinks(runId: string): boolean {
  if (!isKnownShowcaseRunId(runId)) {
    return false;
  }

  return isPublicDemoModeEnv() || isOperatorDemoStaticMode();
}
