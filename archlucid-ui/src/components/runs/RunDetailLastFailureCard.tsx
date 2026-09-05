import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatReviewFailureRecordedAtLabel,
  resolveRunDetailLastFailureSummary,
  type RunDetailLastFailureSummary,
} from "@/components/resolve-run-detail-last-failure-summary";
import { buyerLabelForAgentType } from "@/lib/agent-type-buyer-label";
import { resolveLastFailureCardCopy } from "@/lib/execution-vs-quality-outcome-copy";

export {
  resolveRunDetailLastFailureSummary,
  type RunDetailLastFailureSummary,
} from "@/components/resolve-run-detail-last-failure-summary";

/** Surfaces parsed last agent execution failure on operator run detail (assessment #5 / TB-965). */
export function RunDetailLastFailureCard(props: {
  readonly summary: RunDetailLastFailureSummary | null | undefined;
  readonly legacyRunStatus?: string | null;
  readonly failureRecordedAtUtc?: string | null;
}): ReactElement | null {
  const summary = props.summary;

  if (summary === null || summary === undefined) {
    return null;
  }

  const rawAgentType =
    (typeof summary.agentType === "string" && summary.agentType.length > 0
      ? summary.agentType
      : null) ??
    (typeof summary.agentTypeKey === "string" && summary.agentTypeKey.length > 0
      ? summary.agentTypeKey
      : null);

  const agentLabel = rawAgentType !== null ? buyerLabelForAgentType(rawAgentType) : "Unknown agent";

  const copy = resolveLastFailureCardCopy({
    failureClass: summary.failureClass,
    legacyRunStatus: props.legacyRunStatus,
    triageScenarioId: summary.triageScenarioId,
    rejectReasonCategory: summary.rejectReasonCategory,
    reasonCode: summary.reasonCode,
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
        <p className="m-0">
          <span className="font-medium">Agent:</span> {agentLabel}
        </p>
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
          <p className={cn("m-0", helperClass, OPERATOR_TYPOGRAPHY.helper)}>
            Run status: {props.legacyRunStatus}
          </p>
        ) : null}
        <p className={cn("m-0", helperClass, OPERATOR_TYPOGRAPHY.helper)}>{copy.remediation}</p>
      </CardContent>
    </Card>
  );
}
