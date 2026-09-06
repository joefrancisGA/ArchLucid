"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { TransparencyTrailPanel } from "@/components/feasibility/TransparencyTrailPanel";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import {
  parseTransparencyTrailOpenFromSearch,
  transparencyTrailHrefFromSearch,
} from "@/lib/reviews/transparency-trail-open-url";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

export type RunDetailOverviewTransparencyTrailProps = {
  readonly feasibilityVerdict: ManifestFeasibilityVerdict | null | undefined;
  readonly runCompleted: boolean;
};

/** Overview transparency trail with defect callout when a completed review omits the mandatory record. */
export function RunDetailOverviewTransparencyTrail(props: RunDetailOverviewTransparencyTrailProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const transparencyTrailOpenParam = searchParams.get("transparencyTrailOpen");
  const { isWorkingMode } = useWorkspaceMode();
  const trail = props.feasibilityVerdict?.transparencyTrail ?? null;
  const missingTrailDefect = props.runCompleted && trail === null;
  const [detailsOpen, setDetailsOpenState] = useState(() =>
    parseTransparencyTrailOpenFromSearch(transparencyTrailOpenParam),
  );

  const syncDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(transparencyTrailHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setDetailsOpen = useCallback(
    (open: boolean) => {
      setDetailsOpenState(open);
      syncDetailsOpenToUrl(open);
    },
    [syncDetailsOpenToUrl],
  );

  useEffect(() => {
    setDetailsOpenState(parseTransparencyTrailOpenFromSearch(transparencyTrailOpenParam));
  }, [transparencyTrailOpenParam]);

  return (
    <TransparencyTrailPanel
      trail={trail}
      missingTrailDefect={missingTrailDefect}
      defaultExpanded={isWorkingMode}
      detailsOpen={isWorkingMode ? undefined : detailsOpen}
      onDetailsOpenChange={isWorkingMode ? undefined : setDetailsOpen}
    />
  );
}
