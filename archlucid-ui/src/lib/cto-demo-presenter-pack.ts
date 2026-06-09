import { isBuyerPolishedOperatorShellEnv, isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

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
  return isCtoDemoPackEnv() && isBuyerPolishedOperatorShellEnv();
}

/** Buyer-facing vocabulary replacements (#6). */
export function isCtoDemoVocabularyPassEnv(): boolean {
  return isBuyerPolishedOperatorShellEnv();
}
