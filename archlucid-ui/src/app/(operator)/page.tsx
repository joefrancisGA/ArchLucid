import type { Metadata } from "next";

import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

import { CtoDemoExecutiveLandingRedirectDeferred } from "./_sections/operator-home-page-view-deferred-chunks";
import { loadOperatorHomeRunsDashboardModel } from "./_sections/load-operator-home-runs-dashboard-model";
import { OperatorHomePageView } from "./_sections/OperatorHomePageView";

// Live runs dashboard + auth-bound RSC: keep force-dynamic (ISR would serve stale/wrong-tenant home).
// First-load weight is cut via OperatorHomeDeferredPanels / deferred dashboard chunks (wave 8–9).
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.home,
};

export default async function HomePage() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const runsDashboard = await loadOperatorHomeRunsDashboardModel();

  return (
    <>
      <CtoDemoExecutiveLandingRedirectDeferred />
      <OperatorHomePageView model={{ buyerPolishedShell, runsDashboard }} />
    </>
  );
}
