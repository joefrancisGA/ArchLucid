"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { buildInferredTrailFindingTrustLookup } from "@/lib/feasibility/format-inferred-trail-entry-label";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  TRANSPARENCY_TRAIL_OPEN_PARAM,
  parseTransparencyTrailOpenFromSearch,
  transparencyTrailHrefFromSearch,
} from "@/lib/reviews/transparency-trail-open-url";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

export type RunDetailOverviewTransparencyTrailProps = {
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly runCompleted: boolean;
  readonly quickDecisionFindings?: readonly QuickDecisionFinding[];
};

/** Overview transparency trail with defect callout when a completed review omits the mandatory record. */
export function RunDetailOverviewTransparencyTrail(props: RunDetailOverviewTransparencyTrailProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { isWorkingMode } = useWorkspaceMode();
  const trail = props.feasibilityVerdict?.transparencyTrail ?? null;
  const missingTrailDefect = props.runCompleted && trail === null;
  const urlDetailsOpen = parseTransparencyTrailOpenFromSearch(
    searchParams.get(TRANSPARENCY_TRAIL_OPEN_PARAM),
  );
  const [detailsOpen, setDetailsOpenState] = useState(urlDetailsOpen);
  const detailsOpenRef = useRef(detailsOpen);
  detailsOpenRef.current = detailsOpen;

  const syncDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(transparencyTrailHrefFromSearch(searchParams.toString(), open, pathname));
    },
    [pathname, searchParams],
  );

  const setDetailsOpen = useCallback(
    (open: boolean) => {
      if (detailsOpenRef.current === open) {
        return;
      }

      detailsOpenRef.current = open;
      setDetailsOpenState(open);
      syncDetailsOpenToUrl(open);
    },
    [syncDetailsOpenToUrl],
  );

  useEffect(() => {
    const syncDetailsOpenFromUrl = (): void => {
      const nextOpen = parseTransparencyTrailOpenFromSearch(
        new URLSearchParams(window.location.search).get(TRANSPARENCY_TRAIL_OPEN_PARAM),
      );

      if (detailsOpenRef.current === nextOpen) {
        return;
      }

      detailsOpenRef.current = nextOpen;
      setDetailsOpenState(nextOpen);
    };

    syncDetailsOpenFromUrl();
    window.addEventListener("popstate", syncDetailsOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncDetailsOpenFromUrl);
    };
  }, []);

  useEffect(() => {
    if (detailsOpenRef.current === urlDetailsOpen) {
      return;
    }

    detailsOpenRef.current = urlDetailsOpen;
    setDetailsOpenState(urlDetailsOpen);
  }, [urlDetailsOpen]);

  return (
    <TransparencyTrailPanel
      trail={trail}
      missingTrailDefect={missingTrailDefect}
      defaultExpanded={isWorkingMode}
      detailsOpen={isWorkingMode ? undefined : detailsOpen}
      onDetailsOpenChange={isWorkingMode ? undefined : setDetailsOpen}
      inferredFindingTrustById={buildInferredTrailFindingTrustLookup(props.quickDecisionFindings)}
    />
  );
}
