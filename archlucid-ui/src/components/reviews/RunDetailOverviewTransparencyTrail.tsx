"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { buildInferredTrailFindingTrustLookup } from "@/lib/feasibility/format-inferred-trail-entry-label";
import { commitHrefIfChanged } from "@/lib/navigation/replace-if-href-changed";
import type { QuickDecisionFinding } from "@/lib/quick-decision-finding-from-detail";
import {
  parseTransparencyTrailOpenFromSearch,
  transparencyTrailHrefFromSearch} from "@/lib/reviews/transparency-trail-open-url";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

export type RunDetailOverviewTransparencyTrailProps = {
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly runCompleted: boolean;
  readonly quickDecisionFindings?: readonly QuickDecisionFinding[];
};

/** Overview transparency trail with defect callout when a completed review omits the mandatory record. */
export function RunDetailOverviewTransparencyTrail(props: RunDetailOverviewTransparencyTrailProps) {
  const pathname = usePathname() ?? "/";
  const { isWorkingMode } = useWorkspaceMode();
  const trail = props.feasibilityVerdict?.transparencyTrail ?? null;
  const missingTrailDefect = props.runCompleted && trail === null;
  const [detailsOpen, setDetailsOpenState] = useState(() =>
    parseTransparencyTrailOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("transparencyTrailOpen"),
    ),
  );

  const syncDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      commitHrefIfChanged(transparencyTrailHrefFromSearch(window.location.search.slice(1), open, pathname));
    },
    [pathname],
  );

  const setDetailsOpen = useCallback(
    (open: boolean) => {
      if (detailsOpen === open) {
        return;
      }

      setDetailsOpenState(open);
      syncDetailsOpenToUrl(open);
    },
    [detailsOpen, syncDetailsOpenToUrl],
  );

  useEffect(() => {
    const syncDetailsOpenFromUrl = (): void => {
      const nextOpen = parseTransparencyTrailOpenFromSearch(
        new URLSearchParams(window.location.search).get("transparencyTrailOpen"),
      );

      setDetailsOpenState((current) => (current === nextOpen ? current : nextOpen));
    };

    syncDetailsOpenFromUrl();
    window.addEventListener("popstate", syncDetailsOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncDetailsOpenFromUrl);
    };
  }, []);

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
