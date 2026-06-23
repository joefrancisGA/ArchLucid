"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { resolveBuyerGoldenJourneyNav } from "@/lib/buyer-golden-journey-nav";
import {
  buyerPolishedOperateBackLink,
  isBuyerOperateBackLinkRedundantWithBreadcrumbs,
} from "@/lib/buyer-polished-operate-back-link";
import { buyerPolishedRouteOrientation } from "@/lib/buyer-polished-route-orientation";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getLayerForRoute } from "@/lib/getLayerForRoute";

import { CtoDemoSimulatorTrustBadge } from "@/components/cto-demo/CtoDemoSimulatorTrustBadge";

import { LayerContextStrip } from "./LayerContextStrip";

/** Client bridge: `usePathname()` → `getLayerForRoute()` → `LayerContextStrip` (App Router operator shell). */
export function LayerContextFromRoute() {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const searchRunIdFromUrl =
    pathname.startsWith("/search") ? (searchParams.get("runId")?.trim() ?? "") : "";
  const queryRunId = searchParams.get("runId")?.trim() ?? "";
  const resolvedRouteOrientation = buyerPolishedRouteOrientation(pathname, {
    searchRunId: searchRunIdFromUrl.length > 0 ? searchRunIdFromUrl : undefined,
  });
  const buyerRouteOrientation =
    resolvedRouteOrientation !== null || buyerPolishedShell || pathname.startsWith("/graph")
      ? (resolvedRouteOrientation ?? undefined)
      : null;
  const buyerOperateBackLinkRaw = buyerPolishedShell ? buyerPolishedOperateBackLink(pathname) : null;
  const buyerOperateBackLink =
    buyerOperateBackLinkRaw !== null && isBuyerOperateBackLinkRedundantWithBreadcrumbs(queryRunId, buyerOperateBackLinkRaw)
      ? null
      : buyerOperateBackLinkRaw;
  const buyerGoldenJourneyNav = buyerPolishedShell ? resolveBuyerGoldenJourneyNav(pathname) : null;
  const hideOperateBackLink =
    pathname.startsWith("/ask") || pathname === "/compare" || pathname.startsWith("/compare/");

  // Home already carries pilot context in the hero; avoid a second mission strip that reads like a weak breadcrumb.
  // New request is the primary create flow — keep the header uncluttered like home.
  // Marketing/diagnostic pages should not force the golden-path frame.
  if (
    pathname === "/" ||
    pathname === "/reviews/new" ||
    pathname === "/why-archlucid" ||
    pathname.startsWith("/help")
  ) {
    return null;
  }

  return (
    <>
      <LayerContextStrip
        layerId={getLayerForRoute(pathname)}
        polishedOperateAnalysisLabel={buyerPolishedShell ? "Analysis" : undefined}
        buyerRouteOrientation={buyerRouteOrientation ?? undefined}
        buyerOperateBackLink={buyerOperateBackLink}
        buyerGoldenJourneyNav={buyerGoldenJourneyNav}
        demoDataSourceBadge={buyerGoldenJourneyNav !== null ? <CtoDemoSimulatorTrustBadge /> : undefined}
        hideOperateBackLink={hideOperateBackLink}
      />
    </>
  );
}
