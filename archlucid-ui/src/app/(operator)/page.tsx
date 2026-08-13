import type { Metadata } from "next";
import { Suspense } from "react";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { CtoDemoSponsorLandingRedirectDeferred } from "./_sections/operator-home-page-view-deferred-chunks";
import { OperatorHomePageSuspenseFallback } from "./_sections/OperatorHomePageSuspenseFallback";
import { OperatorHomeRunsDashboardAsync } from "./_sections/OperatorHomeRunsDashboardAsync";

// Live runs dashboard + auth-bound RSC: keep force-dynamic (ISR would serve stale/wrong-tenant home).
// First-load weight is cut via OperatorHomeDeferredPanels / deferred dashboard chunks (wave 8–9).
// Dashboard await is nested under Suspense so redirect + fallback chrome can stream first.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.home,
};

export default function HomePage() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <>
      <CtoDemoSponsorLandingRedirectDeferred />
      <Suspense fallback={<OperatorHomePageSuspenseFallback />}>
        <OperatorHomeRunsDashboardAsync buyerPolishedShell={buyerPolishedShell} />
      </Suspense>
    </>
  );
}
