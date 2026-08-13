import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { isBuyerPolishedOperatorShellEnv, isDemoStrictNavigationRedirectsBypassedForE2E } from "@/lib/demo-ui-env";
import { getShowcaseExecutiveHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { WHY_ARCHLUCID_DOCUMENT_TITLE } from "@/lib/why-archlucid-page-copy";

import { WhyArchLucidPage } from "./_sections/WhyArchLucidPage";

export const metadata: Metadata = {
  title: WHY_ARCHLUCID_DOCUMENT_TITLE,
};

/**
 * Internal pilot proof page — hidden from buyer-polished shell where API/test-harness copy would erode trust.
 * Buyer-polished environments redirect to the showcase executive summary; public competitive narrative lives at `/why`.
 * Live Playwright harnesses set `NEXT_PUBLIC_E2E_ALLOW_DEMO_BLOCKED_ROUTES` at build time to reach this route.
 */
export default function WhyArchLucidRoute() {
  if (isBuyerPolishedOperatorShellEnv() && !isDemoStrictNavigationRedirectsBypassedForE2E()) {
    redirect(getShowcaseExecutiveHref());
  }

  return <WhyArchLucidPage />;
}
