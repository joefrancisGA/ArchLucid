"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useReviewPipelineReRunInFlight } from "@/hooks/use-review-pipeline-rerun-in-flight";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatReviewFailureRecordedAtLabel,
  resolveRunDetailLastFailureSummary,
  type RunDetailLastFailureSummary,
} from "@/components/resolve-run-detail-last-failure-summary";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import {
  plainLanguageFailureCauseSentence,
  resolveLastFailureCardCopy,
} from "@/lib/execution-vs-quality-outcome-copy";
import {
  parseRunLastFailureTechOpenFromSearch,
  runLastFailureTechDetailsHrefFromSearch,
} from "@/lib/runs/run-last-failure-tech-details-url";

export {
  resolveRunDetailLastFailureSummary,
  type RunDetailLastFailureSummary,
} from "@/components/resolve-run-detail-last-failure-summary";

function resolveAgentLabel(summary: RunDetailLastFailureSummary): string | null {
  const rawAgentType =
    (typeof summary.agentType === "string" && summary.agentType.length > 0
      ? summary.agentType
      : null) ??
    (typeof summary.agentTypeKey === "string" && summary.agentTypeKey.length > 0
      ? summary.agentTypeKey
      : null);

  if (rawAgentType === null) {
    return null;
  }

  const label = buyerLabelForAgentType(rawAgentType);

  return label === "Unknown agent" ? null : label;
}

/** Surfaces parsed last agent execution failure on operator run detail (assessment #5 / TB-965). */
export function RunDetailLastFailureCard(props: {
  readonly runId?: string | null;
  readonly summary: RunDetailLastFailureSummary | null | undefined;
  readonly legacyRunStatus?: string | null;
  readonly failureRecordedAtUtc?: string | null;
  readonly hasRecoverySteps?: boolean;
}): ReactElement | null {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const runLastFailureTechOpenParam = searchParams.get("runLastFailureTechOpen");
  const summary = props.summary;
  const runId = props.runId?.trim() ?? "";
  const reRunInFlight = useReviewPipelineReRunInFlight(runId);
  const [technicalDetailsOpen, setTechnicalDetailsOpenState] = useState(() =>
    parseRunLastFailureTechOpenFromSearch(runLastFailureTechOpenParam),
  );

  const syncTechnicalDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(runLastFailureTechDetailsHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setTechnicalDetailsOpen = useCallback(
    (open: boolean) => {
      setTechnicalDetailsOpenState(open);
      syncTechnicalDetailsOpenToUrl(open);
    },
    [syncTechnicalDetailsOpenToUrl],
  );

  useEffect(() => {
    setTechnicalDetailsOpenState(parseRunLastFailureTechOpenFromSearch(runLastFailureTechOpenParam));
  }, [runLastFailureTechOpenParam]);

  if (summary === null || summary === undefined) {
    return null;
  }

  if (runId.length > 0 && reRunInFlight) {
    return null;
  }

  const agentLabel = resolveAgentLabel(summary);
  const whatFailedLine = plainLanguageFailureCauseSentence({
    failureClass: summary.failureClass,
    triageScenarioId: summary.triageScenarioId,
    reasonCode: summary.reasonCode,
  });

  const copy = resolveLastFailureCardCopy({
    failureClass: summary.failureClass,
    legacyRunStatus: props.legacyRunStatus,
    triageScenarioId: summary.triageScenarioId,
    rejectReasonCategory: summary.rejectReasonCategory,
    reasonCode: summary.reasonCode,
    hasRecoverySteps: props.hasRecoverySteps === true,
  });
  const failureRecordedAtLabel = formatReviewFailureRecordedAtLabel(props.failureRecordedAtUtc);

  const borderClass =
    copy.axis === "quality"
      ? "border-amber-600/45 dark:border-amber-700/50"
      : "border-rose-600/40 dark:border-rose-700/50";

  const titleClass =
    copy.axis === "quality"
      ? "text-amber-950 dark:text-amber-100"
      : "text-red-950 dark:text-red-100";

  const bodyClass =
    copy.axis === "quality"
      ? "text-amber-950 dark:text-amber-100"
      : "text-red-950 dark:text-red-100";

  const helperClass =
    copy.axis === "quality"
      ? "text-amber-900/90 dark:text-amber-200/90"
      : "text-red-900/90 dark:text-red-200/90";

  const hasTechnicalDetails =
    agentLabel !== null
    || copy.triageTitle !== null
    || copy.rejectCategoryLabel !== null
    || (typeof summary.reasonCode === "string" && summary.reasonCode.length > 0)
    || (typeof props.legacyRunStatus === "string" && props.legacyRunStatus.length > 0);

  return (
    <Card
      className={cn(
        "rounded-md border bg-al-surface-raised px-3 py-2 text-al-text-primary shadow-sm",
        borderClass,
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="run-detail-last-failure-card"
      data-failure-axis={copy.axis}
    >
      <CardHeader className="pb-2">
        <CardTitle className={cn("font-semibold", titleClass, OPERATOR_TYPOGRAPHY.cardTitle)}>
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-2 pt-0", bodyClass, OPERATOR_TYPOGRAPHY.body)}>
        {failureRecordedAtLabel !== null ? (
          <p className={cn("m-0", helperClass, OPERATOR_TYPOGRAPHY.helper)} data-testid="run-detail-last-failure-recorded-at">
            Failed {failureRecordedAtLabel}
          </p>
        ) : null}
        <p className="m-0" data-testid="run-detail-last-failure-cause">
          <span className="font-medium">What failed:</span> {whatFailedLine}
        </p>
        {hasTechnicalDetails ? (
          <details
            className="rounded-md border border-neutral-200 bg-al-surface-raised p-2 dark:border-neutral-800"
            open={technicalDetailsOpen}
            onToggle={(event) => {
              setTechnicalDetailsOpen((event.currentTarget as HTMLDetailsElement).open);
            }}
          >
            <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              Technical details
            </summary>
            <div className={cn("mt-2 space-y-2", helperClass, OPERATOR_TYPOGRAPHY.helper)}>
              {agentLabel !== null ? (
                <p className="m-0">
                  <span className="font-medium">Agent:</span> {agentLabel}
                </p>
              ) : null}
              <p className="m-0">
                <span className="font-medium">Failure class:</span> {copy.failureClassLabel}
              </p>
              {copy.triageTitle !== null ? (
                <p className="m-0">
                  <span className="font-medium">Triage:</span> {copy.triageTitle}
                </p>
              ) : null}
              {copy.rejectCategoryLabel !== null ? (
                <p className="m-0">
                  <span className="font-medium">Reject category:</span> {copy.rejectCategoryLabel}
                </p>
              ) : null}
              {typeof summary.reasonCode === "string" && summary.reasonCode.length > 0 ? (
                <p className="m-0">
                  <span className="font-medium">Reason code:</span>{" "}
                  <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.helper)}>{summary.reasonCode}</span>
                </p>
              ) : null}
              {typeof props.legacyRunStatus === "string" && props.legacyRunStatus.length > 0 ? (
                <p className="m-0">
                  Review outcome: {props.legacyRunStatus}
                </p>
              ) : null}
            </div>
          </details>
        ) : null}
        <p className={cn("m-0", helperClass, OPERATOR_TYPOGRAPHY.helper)}>{copy.remediation}</p>
      </CardContent>
    </Card>
  );
}
