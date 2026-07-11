import { redirect } from "next/navigation";

import { isBuyerPolishedOperatorShellEnv, isDemoStrictNavigationRedirectsBypassedForE2E } from "@/lib/demo-ui-env";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";

import { WhyArchLucidPage } from "./_sections/WhyArchLucidPage";

/**
 * Internal proof page — hidden from buyer-polished shell where API/test-harness copy would erode trust.
 * Live Playwright harnesses set `NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES` at build time to reach this route.
 */
export default function WhyArchLucidRoute() {
  if (isBuyerPolishedOperatorShellEnv() && !isDemoStrictNavigationRedirectsBypassedForE2E()) {
    redirect(getShowcaseExecutiveHref());
  }

  return <WhyArchLucidPage />;
}
