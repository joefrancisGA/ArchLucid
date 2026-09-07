import type { Metadata } from "next";
import { Suspense } from "react";

import { resolveProductionEvalChromeForServer } from "@/lib/production-desk-chrome";
import { resolveOperatorHomePageMetadataTitle } from "@/lib/product-line/resolve-operator-home-page-metadata";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";

import { CtoDemoSponsorLandingRedirectDeferred } from "./_sections/operator-home-page-view-deferred-chunks";
import { OperatorHomePageSuspenseFallback } from "./_sections/OperatorHomePageSuspenseFallback";
import { OperatorHomeRunsDashboardAsync } from "./_sections/OperatorHomeRunsDashboardAsync";
import { ProductLineHomeSwitch } from "@/components/product-line/ProductLineHomeSwitch";

// Live runs dashboard + auth-bound RSC: keep force-dynamic (ISR would serve stale/wrong-tenant home).
// First-load weight is cut via OperatorHomeDeferredPanels / deferred dashboard chunks (wave 8–9).
// Dashboard await is nested under Suspense so redirect + fallback chrome can stream first.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolveOperatorHomePageMetadataTitle(resolveProductLineIdFromEnv()),
  };
}

export default function HomePage() {
  const evalChromeShell = resolveProductionEvalChromeForServer();
  const envProductLine = resolveProductLineIdFromEnv();

  return (
    <>
      <CtoDemoSponsorLandingRedirectDeferred />
      {envProductLine === "security" ? (
        <ProductLineHomeSwitch />
      ) : (
        <ProductLineHomeSwitch
          architectureHome={
            <Suspense fallback={<OperatorHomePageSuspenseFallback />}>
              <OperatorHomeRunsDashboardAsync buyerPolishedShell={evalChromeShell} />
            </Suspense>
          }
        />
      )}
    </>
  );
}
