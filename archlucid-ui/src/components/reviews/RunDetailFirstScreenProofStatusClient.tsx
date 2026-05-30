"use client";

import { useEffect, useState } from "react";

import {
  buildRunDetailFirstScreenProofSummary,
  type RunDetailFirstScreenProofSummary,
} from "@/lib/run-detail-first-screen-proof-status";
import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";

import { RunDetailFirstScreenProofStatus } from "./RunDetailFirstScreenProofStatus";

type RunDetailFirstScreenProofStatusClientProps = {
  readonly runId: string;
};

export function RunDetailFirstScreenProofStatusClient(
  props: RunDetailFirstScreenProofStatusClientProps,
): React.JSX.Element | null {
  const [summary, setSummary] = useState<RunDetailFirstScreenProofSummary | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const response = await fetch(
          `/api/proxy/v1/pilots/runs/${encodeURIComponent(props.runId)}/pilot-run-deltas`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          if (!cancelled) {
            setLoadFailed(true);
          }

          return;
        }

        const payload = (await response.json()) as PilotRunDeltasProofSummaryJson;

        if (!cancelled) {
          setSummary(buildRunDetailFirstScreenProofSummary(payload));
          setLoadFailed(false);
        }
      }
      catch {
        if (!cancelled) {
          setLoadFailed(true);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [props.runId]);

  if (loadFailed || summary === null) {
    return null;
  }

  return <RunDetailFirstScreenProofStatus summary={summary} />;
}
