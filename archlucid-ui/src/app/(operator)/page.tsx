import type { Metadata } from "next";
import { Suspense } from "react";

import { resolveProductionEvalChromeForServer } from "@/lib/production-desk-chrome";
import { resolveOperatorHomePageMetadataTitle } from "@/lib/product-line/resolve-operator-home-page-metadata";
import { resolveProductLineIdFromEnv } from "@/lib/product-line/resolve-product-line-id";
import { resolveProductLineIdForServer } from "@/lib/product-line/resolve-product-line-id-server";

import { CtoDemoSponsorLandingRedirectDeferred } from "./_sections/operator-home-page-view-deferred-chunks";
import { OperatorHomePageSuspenseFallback } from "./_sections/OperatorHomePageSuspenseFallback";
import { OperatorHomeRunsDashboardAsync } from "./_sections/OperatorHomeRunsDashboardAsync";
import { ProductLineHomeSwitch } from "@/components/product-line/ProductLineHomeSwitch";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: resolveOperatorHomePageMetadataTitle(await resolveProductLineIdForServer()),
  };
}

export default async function HomePage() {
  const evalChromeShell = resolveProductionEvalChromeForServer();
  const hostedProductLine = resolveProductLineIdFromEnv();

  return (
    <>
      <CtoDemoSponsorLandingRedirectDeferred />
      <ProductLineHomeSwitch
        architectureHome={
          hostedProductLine === "security" ? undefined : (
            <Suspense fallback={<OperatorHomePageSuspenseFallback />}>
              <OperatorHomeRunsDashboardAsync buyerPolishedShell={evalChromeShell} />
            </Suspense>
          )
        }
      />
    </>
  );
}
