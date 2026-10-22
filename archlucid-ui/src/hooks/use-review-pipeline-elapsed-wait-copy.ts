"use client";

import { useEffect, useState } from "react";

import { buildLongOperationWaitCopy } from "@/lib/operations/long-operation-wait-copy";

/** Tracks elapsed time for in-pipeline review banners and returns staged wait copy. */
export function useReviewPipelineElapsedWaitCopy(stageLabel: string, active: boolean): string | null {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      return undefined;
    }

    const startedAt = Date.now();
    setElapsedMs(0);

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [active, stageLabel]);

  if (!active) {
    return null;
  }

  const copy = buildLongOperationWaitCopy({
    operationLabel: "Review pipeline",
    stageLabel,
    elapsedMs,
  });

  if (copy.level === "quiet") {
    return null;
  }

  return copy.detail;
}
