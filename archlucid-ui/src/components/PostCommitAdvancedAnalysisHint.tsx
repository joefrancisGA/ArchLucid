"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getShowcaseCompareHref } from "@/lib/buyer/buyer-safe-review-navigation";
import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { usePriorSameRequestCompareHref } from "@/hooks/use-prior-same-request-compare-href";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { SHOW_ALL_DESTINATIONS } from "@/lib/nav-disclosure-copy";

type PostCommitAdvancedAnalysisHintProps = {
  runId: string;
  /** Omits outer card chrome when wrapped in {@link CollapsibleSection} on review detail. */
  embeddedInCollapsible?: boolean;
};

const LOOKBACK = 25;

/**
 * Shown on run detail only after a committed architecture manifest exists. Suggests Advanced
 * Analysis surfaces without pulling operators off the first-review path before finalization.
 * When a prior committed run exists for the same request (recent window), surfaces a primary compare CTA.
 */
export function PostCommitAdvancedAnalysisHint({
  runId,
  embeddedInCollapsible = false,
}: PostCommitAdvancedAnalysisHintProps) {
  const { compareWithPriorHref } = usePriorSameRequestCompareHref(runId, LOOKBACK);

  const encoded = encodeURIComponent(runId);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showcaseSpineRun =
    buyerPolishedShell && canonicalizeDemoRunId(runId) === SHOWCASE_STATIC_DEMO_RUN_ID;
  const showcaseCompareHref =
    showcaseSpineRun && buyerPolishedShell ? getShowcaseCompareHref() : null;
  const compareHrefForLinks = compareWithPriorHref ?? showcaseCompareHref;
  const showComparePriorCta =
    compareWithPriorHref !== null ? !buyerPolishedShell : showcaseCompareHref !== null;

  const sidebarHint = buyerPolishedShell ? (
    <>Deeper passes below are optional—most sponsors consume exported deliverables first.</>
  ) : (
    <>
      Use the links below; choose <em>{SHOW_ALL_DESTINATIONS.show}</em> in the sidebar if a group is collapsed.
    </>
  );

  const body = (
    <>
      {!embeddedInCollapsible ? (
        <p className={cn("m-0 font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Advanced Analysis — optional
        </p>
      ) : null}
      <p className={cn("m-0 mt-1 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
        {buyerPolishedShell ? (
          <>
            If sponsors already have the exported package from <strong>Deliverables & exports</strong>, use this section
            only for technical diffs, graph inspection, or asking about this review. {sidebarHint}
          </>
        ) : (
          <>
            This review has a finalized architecture snapshot. None of this is required to judge first-pilot value—only when you have a
            concrete question the first-review path does not answer (diff two reviews, re-validate the provenance chain, or
            explore a graph). {sidebarHint}
          </>
        )}
      </p>
      {showComparePriorCta && compareHrefForLinks !== null ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant={buyerPolishedShell ? "outline" : "default"}
            size="sm"
            className={
              buyerPolishedShell
                ? undefined
                : "bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600"
            }
          >
            <Link href={compareHrefForLinks} data-testid="post-commit-compare-prior-cta">
              {showcaseCompareHref !== null && compareWithPriorHref === null
                ? "View review change comparison"
                : "Compare to prior finalization (same request)"}
            </Link>
          </Button>
          {compareWithPriorHref !== null ? (
            <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Prior item is the most recent other finalization for the same request (recent activity window).
            </span>
          ) : null}
        </div>
      ) : null}
      <ul className={cn("m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0", OPERATOR_TYPOGRAPHY.body)}>
        <li>
          <Link
            className="text-teal-800 underline dark:text-teal-300"
            href={compareHrefForLinks ?? comparePageHrefAdaptive(runId)}
          >
            Compare
          </Link>
        </li>
        <li>
          <Link className="text-teal-800 underline dark:text-teal-300" href={`/insights/evidence-graph?runId=${encoded}`}>
            Graph
          </Link>
        </li>
        <li>
          <Link className="text-teal-800 underline dark:text-teal-300" href={`/insights/ask-review-questions?runId=${encoded}`}>
            Ask
          </Link>
        </li>
      </ul>
    </>
  );

  if (embeddedInCollapsible) {
    return <div className="space-y-1">{body}</div>;
  }

  return (
    <aside
      className="mb-6 max-w-3xl rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 dark:border-neutral-700 dark:bg-neutral-900/50"
      aria-label="Advanced Analysis — optional next steps after finalization"
    >
      {body}
    </aside>
  );
}
