"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LayerContextStrip } from "@/components/LayerContextStrip";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import { resolveBuyerGoldenJourneyNav } from "@/lib/buyer/buyer-golden-journey-nav";
import { buyerPolishedRouteOrientation } from "@/lib/buyer/buyer-polished-route-orientation";
import { resolveBuyerOperateBackLink } from "@/lib/buyer/buyer-polished-operate-back-link";
import { getLayerForRoute } from "@/lib/getLayerForRoute";

/** Buyer-polished shell: layer orientation + golden-journey stepper on curated diligence routes. */
export function BuyerGoldenJourneyLayerContextStrip(): React.JSX.Element | null {
  const pathname = usePathname() ?? "/";
  const [searchRunId, setSearchRunId] = useState("");
  const evalChromeShell = useProductionEvalChrome();

  useEffect(() => {
    const syncRunIdFromUrl = (): void => {
      const nextRunId = new URLSearchParams(readWindowLocationSearch()).get("runId")?.trim() ?? "";
      setSearchRunId((current) => (current === nextRunId ? current : nextRunId));
    };

    syncRunIdFromUrl();
    window.addEventListener("popstate", syncRunIdFromUrl);

    return () => {
      window.removeEventListener("popstate", syncRunIdFromUrl);
    };
  }, []);

  if (!evalChromeShell) {
    return null;
  }

  const buyerRouteOrientation = buyerPolishedRouteOrientation(pathname, { searchRunId });
  const buyerGoldenJourneyNav = resolveBuyerGoldenJourneyNav(pathname, { searchRunId });

  if (buyerRouteOrientation === null && buyerGoldenJourneyNav === null) {
    return null;
  }

  const pathnameWithSearch =
    searchRunId.length > 0 ? `${pathname}?runId=${encodeURIComponent(searchRunId)}` : pathname;
  const buyerOperateBackLink = resolveBuyerOperateBackLink({
    pathnameWithSearch,
    searchRunId,
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
