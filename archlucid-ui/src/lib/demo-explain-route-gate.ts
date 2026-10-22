import { DEMO_EXPLAIN_BUYER_SHELL_REDIRECT_HREF } from "@/lib/demo-explain-page-copy";
import {
  isDemoStrictNavigationRedirectsBypassedForE2E,
  isOperatorExperienceFullShellEnv,
} from "@/lib/demo-ui-env";

/**
 * TB-1322 (IA-014): `/demo/explain` is internal demo tooling — buyer-polished shells redirect to the
 * canonical anonymous proof funnel. Full-operator shells (or Playwright harness bypass) may render the page.
 */
export function shouldRedirectDemoExplainFromBuyerShell(): boolean {
  if (isDemoStrictNavigationRedirectsBypassedForE2E()) {
    return false;
  }

  return !isOperatorExperienceFullShellEnv();
}

/** Honest public proof destination when {@link shouldRedirectDemoExplainFromBuyerShell} is true. */
export function getDemoExplainBuyerShellRedirectHref(): string {
  return DEMO_EXPLAIN_BUYER_SHELL_REDIRECT_HREF;
}
