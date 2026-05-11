"use client";

import Link from "next/link";

import { pickPriorForSameRequest } from "@/components/BeforeAfterDelta/pick-prior-for-same-request";
import { useDeltaQuery } from "@/components/BeforeAfterDelta/useDeltaQuery";
import { Button } from "@/components/ui/button";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { NAV_DISCLOSURE } from "@/lib/nav-disclosure-copy";

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
  const { status, data } = useDeltaQuery({ count: LOOKBACK });
  const current =
    status === "ready" && data !== null ? data.items.find((row) => row.runId === runId) : undefined;
  const prior =
    current !== undefined && data !== null ? pickPriorForSameRequest(current, data.items) : null;

  const compareWithPriorHref =
    prior !== null ? comparePageHrefAdaptive(prior.runId, runId) : null;

  const encoded = encodeURIComponent(runId);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const sidebarHint = buyerPolishedShell ? (
    <>Deeper passes below are optional—most sponsors consume exported deliverables first.</>
  ) : (
    <>
      Use the links below; enable <em>{NAV_DISCLOSURE.extended.show}</em> in the sidebar if needed.
    </>
  );

  const body = (
    <>
      {!embeddedInCollapsible ? (
        <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
          Advanced Analysis — optional
        </p>
      ) : null}
      <p className="m-0 mt-1 text-sm text-neutral-800 dark:text-neutral-200">
        {buyerPolishedShell ? (
          <>
            If sponsors already have the exported package from <strong>Deliverables & exports</strong>, use this section
            only for technical diffs, graph inspection, or asking about this review. {sidebarHint}
          </>
        ) : (
          <>
            This run has a finalized manifest. None of this is required to judge first-pilot value—only when you have a
            concrete question the first-review path does not answer (diff two runs, re-validate the provenance chain, or
            explore a graph). {sidebarHint}
          </>
        )}
      </p>
      {compareWithPriorHref !== null ? (
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
            <Link href={compareWithPriorHref} data-testid="post-commit-compare-prior-cta">
              Compare to prior finalization (same request)
            </Link>
          </Button>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            Prior item is the most recent other finalization for the same request (recent activity window).
          </span>
        </div>
      ) : null}
      <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-sm">
        <li>
          <Link
            className="text-teal-800 underline dark:text-teal-300"
            href={comparePageHrefAdaptive(runId)}
          >
            Compare
          </Link>
        </li>
        <li>
          <Link className="text-teal-800 underline dark:text-teal-300" href={`/graph?runId=${encoded}`}>
            Graph
          </Link>
        </li>
        <li>
          <Link className="text-teal-800 underline dark:text-teal-300" href={`/ask?runId=${encoded}`}>
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
