"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  buildRunDetailFirstScreenProofSummary,
  type RunDetailFirstScreenProofSummary,
} from "@/lib/runs/run-detail-first-screen-proof-status";
import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { RunDetailFirstScreenProofStatus } from "./RunDetailFirstScreenProofStatus";

type RunDetailFirstScreenProofStatusClientProps = {
  readonly runId: string;
};

export function RunDetailFirstScreenProofStatusClient(
  props: RunDetailFirstScreenProofStatusClientProps,
): React.JSX.Element | null {
  const [summary, setSummary] = useState<RunDetailFirstScreenProofSummary | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const retryLoad = useCallback(() => {
    setLoadFailed(false);
    setLoading(true);
    setSummary(null);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let canceled = false;

    async function load(): Promise<void> {
      try {
        const response = await fetch(
          `/api/proxy/v1/pilots/runs/${encodeURIComponent(props.runId)}/pilot-run-deltas`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          if (!cancelled) {
            setLoadFailed(true);
            setLoading(false);
          }

          return;
        }

        const payload = (await response.json()) as PilotRunDeltasProofSummaryJson;

        if (!cancelled) {
          setSummary(buildRunDetailFirstScreenProofSummary(payload));
          setLoadFailed(false);
          setLoading(false);
        }
      } catch {
        if (!canceled) {
          setLoadFailed(true);
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      canceled = true;
    };
  }, [props.runId, reloadToken]);

  if (loading) {
    return null;
  }

  if (loadFailed) {
    return (
      <section
        className={cn("min-w-0 overflow-visible", DESIGN_TOKENS.callout.warn, "rounded-lg px-4 py-3")}
        data-testid="run-detail-first-screen-proof-status-load-failed"
        role="alert"
        aria-label="Proof status unavailable"
      >
        <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Proof status could not be loaded for this review.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={retryLoad}
          data-testid="run-detail-first-screen-proof-status-retry"
        >
          Retry load
        </Button>
      </section>
    );
  }

  if (summary === null) {
    return null;
  }

  return <RunDetailFirstScreenProofStatus summary={summary} />;
}
