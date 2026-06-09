import { readBuyerCtoDemoTourActive } from "@/lib/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

function isCtoDemoNavExpandedEnvFlag(): boolean {
  return (
    process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED === "true" ||
    process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED === "1"
  );
}

/** Explicit demo packaging — `NEXT_PUBLIC_DEMO_MODE` or static operator build. */
export function isCtoDemoPackEnv(): boolean {
  return isNextPublicDemoMode() || isStaticDemoPayloadFallbackEnabled();
}

/** Presenter safe mode (#10) — buyer-polished shell in packaged demo builds. */
export function isCtoDemoPresenterSafeModeEnv(): boolean {
  return isBuyerPolishedOperatorShellEnv() && isCtoDemoPackEnv();
}

/** Redirect operator home to the showcase executive summary (#4). */
export function isCtoDemoExecutiveLandingEnv(): boolean {
  return isCtoDemoPresenterSafeModeEnv();
}

/** Expand Graph / Governance / Audit in primary nav without progressive disclosure (#8). */
export function isCtoDemoNavExpandedEnv(): boolean {
  if (!isBuyerPolishedOperatorShellEnv()) {
    return false;
  }

  if (isCtoDemoNavExpandedEnvFlag()) {
    return true;
  }

  // Runtime: presenter clicked Start CTO demo (localStorage) — generic DEMO_MODE alone must not expand nav.
  return readBuyerCtoDemoTourActive();
}

/** Buyer-facing vocabulary replacements (#6). */
export function isCtoDemoVocabularyPassEnv(): boolean {
  return isBuyerPolishedOperatorShellEnv();
}
