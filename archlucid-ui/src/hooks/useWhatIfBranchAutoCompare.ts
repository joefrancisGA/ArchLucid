"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getRunSummary } from "@/lib/api";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import {
  bothRunsReadyForBranchCompare,
  isWhatIfAutoCompareDone,
  markWhatIfAutoCompareDone,
} from "@/lib/draft-branch-auto-compare";

export type WhatIfAutoComparePhase = "idle" | "polling" | "redirecting" | "done" | "skipped";

const POLL_MS = 3000;
const MAX_POLL_MS = 600_000;

export type UseWhatIfBranchAutoCompareOptions = {
  readonly enabled: boolean;
  readonly parentRunId: string;
  readonly currentRunId: string;
  readonly hasCurrentManifest: boolean;
};

/**
 * Polls parent and branch run summaries; navigates to Compare once both golden manifests exist (R12).
 */
export function useWhatIfBranchAutoCompare(
  options: UseWhatIfBranchAutoCompareOptions,
): WhatIfAutoComparePhase {
  const router = useRouter();
  const redirectedRef = useRef(false);
  const [phase, setPhase] = useState<WhatIfAutoComparePhase>("idle");

  useEffect(() => {
    if (!options.enabled) {
      setPhase("skipped");
      return;
    }

    if (isWhatIfAutoCompareDone(options.parentRunId, options.currentRunId)) {
      setPhase("done");
      return;
    }

    let canceled = false;
    const startedAt = Date.now();
    setPhase("polling");

    const redirectToCompare = (): void => {
      if (redirectedRef.current) {
        return;
      }

      redirectedRef.current = true;
      setPhase("redirecting");
      markWhatIfAutoCompareDone(options.parentRunId, options.currentRunId);
      router.push(comparePageHrefAdaptive(options.parentRunId, options.currentRunId));
      setPhase("done");
    };

    const tick = async (): Promise<void> => {
      if (canceled || redirectedRef.current) {
        return;
      }

      if (Date.now() - startedAt > MAX_POLL_MS) {
        setPhase("idle");
        return;
      }

      try {
        const parent = await getRunSummary(options.parentRunId);
        const branch = options.hasCurrentManifest
          ? { hasGoldenManifest: true }
          : await getRunSummary(options.currentRunId);

        if (!bothRunsReadyForBranchCompare(parent, branch)) {
          return;
        }

        redirectToCompare();
      } catch {
        /* keep polling */
      }
    };

    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    options.enabled,
    options.hasCurrentManifest,
    options.parentRunId,
    options.currentRunId,
    router,
  ]);

  return phase;
}
