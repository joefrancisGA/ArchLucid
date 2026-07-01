"use client";

import { usePathname } from "next/navigation";

import { LayerContextStrip } from "@/components/LayerContextStrip";
import { resolveBuyerGoldenJourneyNav } from "@/lib/buyer-golden-journey-nav";
import { buyerPolishedRouteOrientation } from "@/lib/buyer-polished-route-orientation";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getLayerForRoute } from "@/lib/getLayerForRoute";

/** Buyer-polished shell: layer orientation + golden-journey stepper on curated diligence routes. */
export function BuyerGoldenJourneyLayerContextStrip(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";

  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const buyerRouteOrientation = buyerPolishedRouteOrientation(pathname);
  const buyerGoldenJourneyNav = resolveBuyerGoldenJourneyNav(pathname);

  if (buyerRouteOrientation === null) {
    return null;
  }

  return (
    <LayerContextStrip
      layerId={getLayerForRoute(pathname)}
      buyerRouteOrientation={buyerRouteOrientation}
      buyerGoldenJourneyNav={buyerGoldenJourneyNav}
      hideOperateBackLink
    />
  );
}
