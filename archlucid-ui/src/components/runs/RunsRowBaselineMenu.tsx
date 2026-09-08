"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { persistCompareBaselineRunId } from "@/lib/compare-baseline-run";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  RUNS_ROW_BASELINE_MENU_RUN_ID_PARAM,
  parseRunsRowBaselineMenuRunIdFromSearch,
  runsRowBaselineMenuDisclosureHrefFromSearch,
} from "@/lib/runs/runs-row-baseline-menu-disclosure-url";
import { showSuccess } from "@/lib/toast";

/**
 * Compact per-row menu on the reviews list: set the browser-local compare baseline (committed runs only).
 */
export function RunsRowBaselineMenu(props: { runId: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runsRowBaselineMenuRunIdParam = searchParams.get(RUNS_ROW_BASELINE_MENU_RUN_ID_PARAM);
  const [openRunId, setOpenRunIdState] = useState(() => parseRunsRowBaselineMenuRunIdFromSearch(runsRowBaselineMenuRunIdParam));
  const syncOpenRunIdToUrl = useCallback(
    (runId: string | null) => {
      router.replace(
        runsRowBaselineMenuDisclosureHrefFromSearch(searchParams.toString(), runId, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );
  const setOpenRunId = useCallback(
    (runId: string | null) => {
      setOpenRunIdState(runId ?? "");
      syncOpenRunIdToUrl(runId);
    },
    [syncOpenRunIdToUrl],
  );
  useEffect(() => {
    setOpenRunIdState(parseRunsRowBaselineMenuRunIdFromSearch(runsRowBaselineMenuRunIdParam));
  }, [runsRowBaselineMenuRunIdParam]);
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const runEnc = encodeURIComponent(props.runId);
  const menuOpen = openRunId === props.runId;

  const onSetBaseline = () => {
    persistCompareBaselineRunId(props.runId);
    showSuccess("Baseline review saved for compare.");
    setOpenRunId(null);
  };

  if (buyerPolished) {
    return (
      <div
        data-testid={`runs-row-baseline-menu-${props.runId}`}
        className={cn("flex flex-col items-start gap-1.5 font-medium", OPERATOR_TYPOGRAPHY.helper)}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <Link
          href={`/governance/approval-queue?runId=${runEnc}`}
          className={OPERATOR_BODY_INLINE_LINK_CLASS}
        >
          View approval
        </Link>
        <Link href={auditTrailNavHref(props.runId)} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          View audit trail
        </Link>
        <Link href={`/insights/ask-review-questions?runId=${runEnc}`} className={OPERATOR_BODY_INLINE_LINK_CLASS}>
          Ask about this review
        </Link>
      </div>
    );
  }

  return (
    <details
      className="relative inline-block text-left"
      data-testid={`runs-row-baseline-menu-${props.runId}`}
      open={menuOpen}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        setOpenRunId(nextOpen ? props.runId : null);
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <summary
        className={cn("cursor-pointer list-none", OPERATOR_LINK.optional,
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        More
      </summary>
      <div className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-md border border-neutral-200 bg-white py-1 shadow-md dark:border-neutral-700 dark:bg-neutral-950">
        <button
          type="button"
          className={cn("block w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800", OPERATOR_TYPOGRAPHY.body)}
          onClick={() => {
            onSetBaseline();
          }}
        >
          Set as baseline
        </button>
      </div>
    </details>
  );
}
