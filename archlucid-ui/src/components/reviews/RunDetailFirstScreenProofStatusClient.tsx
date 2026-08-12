"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  buildRunDetailFirstScreenProofSummary,
  RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_BODY,
  RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_HEADING,
  RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_RETRY_HINT,
  type RunDetailFirstScreenProofSummary,
} from "@/lib/runs/run-detail-first-screen-proof-status";
import type { PilotRunDeltasProofSummaryJson } from "@/lib/pilot-proof-readiness";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
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
          if (!canceled) {
            setLoadFailed(true);
            setLoading(false);
          }

          return;
        }

        const payload = (await response.json()) as PilotRunDeltasProofSummaryJson;

        if (!canceled) {
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
        className={cn("min-w-0 overflow-visible rounded-lg px-4 py-3", DESIGN_TOKENS.callout.warnShell)}
        data-testid="run-detail-first-screen-proof-status-load-failed"
        role="alert"
        aria-label={RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_HEADING}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_HEADING}
            </h3>
            <StatusTag kind="needs-attention" label="Needs attention" />
          </div>
          <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_BODY}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retryLoad}
            data-testid="run-detail-first-screen-proof-status-retry"
          >
            Retry load
          </Button>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_RETRY_HINT}{" "}
            <Link href={buildReviewDetailTabHref(props.runId, "activity")} className="underline underline-offset-2">
              Open Activity tab
            </Link>
          </p>
        </div>
      </section>
    );
  }

  if (summary === null) {
    return null;
  }

  return <RunDetailFirstScreenProofStatus summary={summary} />;
}
