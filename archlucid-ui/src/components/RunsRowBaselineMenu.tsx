"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { RefObject } from "react";
import Link from "next/link";
import { useRef } from "react";

import { auditTrailNavHref } from "@/lib/audit-nav-paths";
import { persistCompareBaselineRunId } from "@/lib/compare-baseline-run";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { showSuccess } from "@/lib/toast";

function closeDetails(ref: RefObject<HTMLDetailsElement | null>): void {
  const el = ref.current;

  if (el !== null) {
    el.open = false;
  }
}

/**
 * Compact per-row menu on the reviews list: set the browser-local compare baseline (committed runs only).
 */
export function RunsRowBaselineMenu(props: { runId: string }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const buyerPolished = isBuyerPolishedOperatorShellEnv();
  const runEnc = encodeURIComponent(props.runId);

  const onSetBaseline = () => {
    persistCompareBaselineRunId(props.runId);
    showSuccess("Baseline review saved for compare.");
    closeDetails(detailsRef);
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
          className="text-teal-800 underline underline-offset-2 dark:text-teal-300"
        >
          View governance approval
        </Link>
        <Link href={auditTrailNavHref(props.runId)} className="text-teal-800 underline underline-offset-2 dark:text-teal-300">
          View audit trail
        </Link>
        <Link href={`/insights/ask-review-questions?runId=${runEnc}`} className="text-teal-800 underline underline-offset-2 dark:text-teal-300">
          Ask about this review
        </Link>
      </div>
    );
  }

  return (
    <details
      ref={detailsRef}
      className="relative inline-block text-left"
      data-testid={`runs-row-baseline-menu-${props.runId}`}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <summary
        className={cn("cursor-pointer list-none font-semibold text-teal-800 underline-offset-2 hover:underline dark:text-teal-300", OPERATOR_TYPOGRAPHY.helper,
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
