"use client";

import type { RefObject } from "react";
import { useRef } from "react";

import { persistCompareBaselineRunId } from "@/lib/compare-baseline-run";
import { showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

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

  const onSetBaseline = () => {
    persistCompareBaselineRunId(props.runId);
    showSuccess("Baseline review saved for compare.");
    closeDetails(detailsRef);
  };

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
        className={cn(
          "cursor-pointer list-none text-xs font-semibold text-teal-800 underline-offset-2 hover:underline dark:text-teal-300",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        More
      </summary>
      <div className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-md border border-neutral-200 bg-white py-1 shadow-md dark:border-neutral-700 dark:bg-neutral-950">
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
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
