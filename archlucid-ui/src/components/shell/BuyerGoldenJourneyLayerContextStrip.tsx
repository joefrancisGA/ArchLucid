"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { LayerContextStrip } from "@/components/LayerContextStrip";
import { getBreadcrumbs } from "@/lib/breadcrumb-map";
import { shouldShowBreadcrumbTrail } from "@/lib/breadcrumb-visibility";
import { resolveBuyerGoldenJourneyNav } from "@/lib/buyer-golden-journey-nav";
import { buyerPolishedRouteOrientation } from "@/lib/buyer-polished-route-orientation";
import { resolveBuyerOperateBackLinkWhenShellBreadcrumbsHidden } from "@/lib/buyer-polished-operate-back-link";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { getLayerForRoute } from "@/lib/getLayerForRoute";

/** Buyer-polished shell: layer orientation + golden-journey stepper on curated diligence routes. */
export function BuyerGoldenJourneyLayerContextStrip(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const searchRunId = searchParams.get("runId")?.trim() ?? "";

  if (!isBuyerPolishedOperatorShellEnv()) {
    return null;
  }

  const buyerRouteOrientation = buyerPolishedRouteOrientation(pathname, { searchRunId });
  const buyerGoldenJourneyNav = resolveBuyerGoldenJourneyNav(pathname, { searchRunId });

  if (buyerRouteOrientation === null && buyerGoldenJourneyNav === null) {
    return null;
  }

  const pathnameWithSearch =
    searchRunId.length > 0 ? `${pathname}?runId=${encodeURIComponent(searchRunId)}` : pathname;
  const breadcrumbItems = getBreadcrumbs(pathname, {
    buyerPolishedShell: true,
    queryRunId: searchRunId.length > 0 ? searchRunId : undefined,
  });
  const showShellBreadcrumbs = shouldShowBreadcrumbTrail(pathname, breadcrumbItems, {
    queryRunId: searchRunId.length > 0 ? searchRunId : undefined,
    buyerGoldenJourneyNav,
  });
  const buyerOperateBackLink = resolveBuyerOperateBackLinkWhenShellBreadcrumbsHidden({
    pathnameWithSearch,
    searchRunId,
    showShellBreadcrumbs,
    buyerGoldenJourneyNav,
  });

  return (
    <LayerContextStrip
      layerId={getLayerForRoute(pathname)}
      buyerRouteOrientation={buyerRouteOrientation ?? undefined}
      buyerGoldenJourneyNav={buyerGoldenJourneyNav}
      buyerOperateBackLink={buyerOperateBackLink}
      hideOperateBackLink={buyerOperateBackLink === null}
    />
  );
}
