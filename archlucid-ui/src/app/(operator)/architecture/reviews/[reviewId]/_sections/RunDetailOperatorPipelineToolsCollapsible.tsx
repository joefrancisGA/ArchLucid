"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RunDetailAiRefinePanel } from "@/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailAiRefinePanel";
import { AiBudgetSpendNotice } from "@/components/ai-budget/AiBudgetSpendNotice";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_REPLAY_PATH } from "@/lib/internal-ops-route-paths";
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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runRefineWithAiOpenParam = searchParams.get("runRefineWithAiOpen");
  const [open, setOpenState] = useState(() => parseRunRefineWithAiOpenFromSearch(runRefineWithAiOpenParam));

  const syncOpenToUrl = useCallback(
    (detailsOpen: boolean) => {
      router.replace(runDetailRefineWithAiDisclosureHrefFromSearch(searchParams.toString(), detailsOpen, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setOpen = useCallback(
    (detailsOpen: boolean) => {
      setOpenState(detailsOpen);
      syncOpenToUrl(detailsOpen);
    },
    [syncOpenToUrl],
  );

  useEffect(() => {
    setOpenState(parseRunRefineWithAiOpenFromSearch(runRefineWithAiOpenParam));
  }, [runRefineWithAiOpenParam]);

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
