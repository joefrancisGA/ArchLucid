"use client";

import { usePathname } from "next/navigation";

import { resolveBuyerGoldenJourneyNav } from "@/lib/buyer-golden-journey-nav";
import { buyerPolishedOperateBackLink } from "@/lib/buyer-polished-operate-back-link";
import { buyerPolishedRouteOrientation } from "@/lib/buyer-polished-route-orientation";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getLayerForRoute } from "@/lib/getLayerForRoute";

import { LayerContextStrip } from "./LayerContextStrip";

/** Client bridge: `usePathname()` → `getLayerForRoute()` → `LayerContextStrip` (App Router operator shell). */
export function LayerContextFromRoute() {
  const pathname = usePathname() ?? "/";
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const buyerRouteOrientation = buyerPolishedShell ? buyerPolishedRouteOrientation(pathname) : null;
  const buyerOperateBackLink = buyerPolishedShell ? buyerPolishedOperateBackLink(pathname) : null;
  const buyerGoldenJourneyNav = buyerPolishedShell ? resolveBuyerGoldenJourneyNav(pathname) : null;

  // Home already carries pilot context in the hero; avoid a second mission strip that reads like a weak breadcrumb.
  // New request is the primary create flow — keep the header uncluttered like home.
  if (pathname === "/" || pathname === "/reviews/new") {
    return null;
  }

  return (
    <LayerContextStrip
      layerId={getLayerForRoute(pathname)}
      polishedOperateAnalysisLabel={buyerPolishedShell ? "Analysis" : undefined}
      buyerRouteOrientation={buyerRouteOrientation ?? undefined}
      buyerOperateBackLink={buyerOperateBackLink}
      buyerGoldenJourneyNav={buyerGoldenJourneyNav}
    />
  );
}
