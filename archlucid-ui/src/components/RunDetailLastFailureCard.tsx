import type { ReactElement } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunDetail } from "@/types/authority";

type LastFailureSummary = {
  readonly agentType?: string | null;
  readonly agentTypeKey?: string | null;
  readonly failureClass?: string | null;
  readonly reasonCode?: string | null;
};

/** Surfaces parsed last agent execution failure on operator run detail (assessment #5). */
export function RunDetailLastFailureCard(props: {
  readonly summary: LastFailureSummary | null | undefined;
  readonly legacyRunStatus?: string | null;
}): ReactElement | null {
  const summary = props.summary;

  if (summary === null || summary === undefined)
    return null;

  const agentLabel =
    (typeof summary.agentType === "string" && summary.agentType.length > 0
      ? summary.agentType
      : null) ??
    (typeof summary.agentTypeKey === "string" && summary.agentTypeKey.length > 0
      ? summary.agentTypeKey
      : null) ??
    "Unknown agent";

  const failureClass =
    typeof summary.failureClass === "string" && summary.failureClass.length > 0
      ? summary.failureClass
      : "Unknown";

  const reasonCode =
    typeof summary.reasonCode === "string" && summary.reasonCode.length > 0
      ? summary.reasonCode
      : null;

  return (
    <Card
      className="rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-sm text-al-text-primary dark:border-rose-700/50 shadow-sm"
      data-testid="run-detail-last-failure-card"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-red-950 dark:text-red-100">
          Last execution failure — HOLD
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 text-sm text-red-950 dark:text-red-100">
        <p className="m-0">
          <span className="font-medium">Agent:</span> {agentLabel}
        </p>
        <p className="m-0">
          <span className="font-medium">Failure class:</span> {failureClass}
        </p>
        {reasonCode !== null ? (
          <p className="m-0">
            <span className="font-medium">Reason code:</span>{" "}
            <span className="font-mono text-xs">{reasonCode}</span>
          </p>
        ) : null}
        {typeof props.legacyRunStatus === "string" && props.legacyRunStatus.length > 0 ? (
          <p className="m-0 text-xs text-red-900/90 dark:text-red-200/90">
            Run status: {props.legacyRunStatus}
          </p>
        ) : null}
        <p className="m-0 text-xs text-red-900/90 dark:text-red-200/90">
          Retry or inspect agent traces before commit. Raw LLM payloads are not shown here.
        </p>
      </CardContent>
    </Card>
  );
}

export function resolveRunDetailLastFailureSummary(
  detail: RunDetail,
): LastFailureSummary | null {
  const summary = (detail as { lastAgentExecutionFailure?: LastFailureSummary | null })
    .lastAgentExecutionFailure;

  if (summary !== null && summary !== undefined)
    return summary;

  return null;
}
