"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { RunDetailAiRefinePanel } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailAiRefinePanel";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
import { commitHrefIfChanged, readWindowLocationSearch } from "@/lib/navigation/replace-if-href-changed";
import {
  parseRunRefineWithAiOpenFromSearch,
  runDetailRefineWithAiDisclosureHrefFromSearch,
} from "@/lib/runs/run-detail-refine-with-ai-disclosure-url";
import { cn } from "@/lib/utils";

type RunDetailOperatorPipelineToolsCollapsibleProps = {
  readonly runId: string;
};

/**
 * Operator-initiated AI refinement for this review — spends metered AI budget on demand.
 * Closed-loop architecture intelligence runs in place; replay validation stays nearby.
 */
export function RunDetailOperatorPipelineToolsCollapsible(
  props: RunDetailOperatorPipelineToolsCollapsibleProps,
): ReactElement {
  const { runId } = props;
  const pathname = usePathname() ?? "/";
  const [open, setOpenState] = useState(() =>
    parseRunRefineWithAiOpenFromSearch(
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("runRefineWithAiOpen"),
    ),
  );
  const openRef = useRef(open);
  openRef.current = open;

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      commitHrefIfChanged(
        runDetailRefineWithAiDisclosureHrefFromSearch(readWindowLocationSearch(), detailsOpen, pathname),
        { notify: false },
      );
    },
    [pathname],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      if (openRef.current === detailsOpen) {
        return;
      }

      openRef.current = detailsOpen;
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    const syncOpenFromUrl = (): void => {
      const nextOpen = parseRunRefineWithAiOpenFromSearch(
        new URLSearchParams(window.location.search).get("runRefineWithAiOpen"),
      );

      if (openRef.current === nextOpen) {
        return;
      }

      openRef.current = nextOpen;
      setOpenState(nextOpen);
    };

    syncOpenFromUrl();
    window.addEventListener("popstate", syncOpenFromUrl);

    return () => {
      window.removeEventListener("popstate", syncOpenFromUrl);
    };
  }, []);

  return (
    <CollapsibleSection
      title="Refine with AI"
      open={open}
      onToggle={setOpen}
      sectionTestId="run-detail-refine-with-ai"
    >
      <div className="space-y-3">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Spend AI budget on this review to deepen findings, challenge assumptions, and publish gated
          recommendations back into the product.
        </p>

        <AiBudgetSpendNotice
          action="Architecture reasoning"
          testId="run-detail-refine-ai-budget-notice"
        />

        <RunDetailAiRefinePanel runId={runId} />

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${INTERNAL_REPLAY_PATH}?runId=${encodeURIComponent(runId)}`}>Validate review</Link>
          </Button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
