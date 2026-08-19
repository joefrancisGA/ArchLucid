"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { usePilotRunDeltasQuery } from "@/hooks/use-pilot-run-deltas-query";
import {
  buildRunDetailFirstScreenProofSummary,
  RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_BODY,
  RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_HEADING,
  RUN_DETAIL_PROOF_STATUS_UNAVAILABLE_RETRY_HINT,
} from "@/lib/runs/run-detail-first-screen-proof-status";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { RunDetailFirstScreenProofStatus } from "./RunDetailFirstScreenProofStatus";

type RunDetailFirstScreenProofStatusClientProps = {
  readonly runId: string;
};

export function RunDetailFirstScreenProofStatusClient(
  props: RunDetailFirstScreenProofStatusClientProps,
): React.JSX.Element | null {
  const { data: payload, isPending, isError, refetch } = usePilotRunDeltasQuery(props.runId);

  const retryLoad = useCallback(() => {
    void refetch();
  }, [refetch]);

  const summary = useMemo(
    () => (payload === undefined ? null : buildRunDetailFirstScreenProofSummary(payload)),
    [payload],
  );

  if (isPending) {
    return null;
  }

  if (isError) {
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
            <Link href={buildReviewDetailTabHref(props.runId, "activity")} className={OPERATOR_LINK.optional}>
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
