"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useRunSummaryStream } from "@/hooks/useRunSummaryStream";

export type UseIncrementalReviewFindingsRefreshOptions = {
  readonly runId: string;
  readonly initialHasFindingsSnapshot?: boolean;
  readonly enabled: boolean;
};

/**
 * Refreshes the review detail route when findings first land during execute so the
 * findings tab can stream in without waiting for the full pipeline to finish.
 */
export function useIncrementalReviewFindingsRefresh(
  options: UseIncrementalReviewFindingsRefreshOptions,
): void {
  const router = useRouter();
  const hadFindingsSnapshotRef = useRef(false);

  useEffect(() => {
    hadFindingsSnapshotRef.current = options.initialHasFindingsSnapshot === true;
  }, [options.runId, options.initialHasFindingsSnapshot]);

  const { summary } = useRunSummaryStream(options.runId, {
    enabled: options.enabled,
    initialSummary: null,
  });

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    const hasFindingsSnapshot = summary?.hasFindingsSnapshot === true;

    if (hasFindingsSnapshot && !hadFindingsSnapshotRef.current) {
      hadFindingsSnapshotRef.current = true;
      router.refresh();
    }
  }, [options.enabled, options.runId, router, summary?.hasFindingsSnapshot]);
}
