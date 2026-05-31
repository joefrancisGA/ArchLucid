"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  COMPARE_BASELINE_CHANGED_EVENT,
  COMPARE_BASELINE_RUN_STORAGE_KEY,
  readCompareBaselineRunId,
} from "@/lib/compare-baseline-run";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

/**
 * When a baseline run id is stored for this browser, surfaces a one-click navigation to `/compare`
 * (baseline vs this review). Hidden when this review is the baseline or no baseline is set.
 */
export function CompareToBaselineCta(props: { currentRunId: string }) {
  const [baseline, setBaseline] = useState<string | null>(null);

  useEffect(() => {
    function refresh() {
      setBaseline(readCompareBaselineRunId());
    }

    refresh();

    function onCustom() {
      refresh();
    }

    function onStorage(e: StorageEvent) {
      if (e.key === COMPARE_BASELINE_RUN_STORAGE_KEY) {
        refresh();
      }
    }

    window.addEventListener(COMPARE_BASELINE_CHANGED_EVENT, onCustom);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(COMPARE_BASELINE_CHANGED_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (baseline === null || baseline === props.currentRunId) {
    return null;
  }

  return (
    <div
      className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 flex flex-wrap items-center gap-2 px-3 py-2 text-sm"
      data-testid="compare-to-baseline-banner"
    >
      <span className="text-neutral-700 dark:text-neutral-200">
        A baseline review is selected in this browser — open Compare with it as the prior run.
      </span>
      <Button variant="secondary" size="sm" asChild>
        <Link href={comparePageHrefAdaptive(baseline, props.currentRunId)} data-testid="compare-to-baseline-link">
          Compare to baseline
        </Link>
      </Button>
    </div>
  );
}
