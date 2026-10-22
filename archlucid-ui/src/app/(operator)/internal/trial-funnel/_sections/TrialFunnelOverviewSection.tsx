"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_LAYOUT, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { TRIAL_FUNNEL_CONVERSION_NOTE, trialFunnelStageDefinition } from "@/lib/trial-funnel-metric-contract";
import type { TrialFunnelOperationalSummary, TrialFunnelStageMetric } from "@/lib/trial-funnel-ops";

import { formatPercent, formatPeriodDelta, medianTimingLabel } from "./trial-funnel-formatters";

type LoadState = "loading" | "ready" | "error";

function FunnelStageBar({ stage, maxCount }: { stage: TrialFunnelStageMetric; maxCount: number }): ReactElement {
  const widthPercent = maxCount > 0 ? Math.max(8, Math.round((stage.count / maxCount) * 100)) : 8;

  return (
    <div className="space-y-1">
      <div
        className="h-3 rounded-sm bg-sky-700/80 dark:bg-sky-500/70"
        style={{ width: `${widthPercent}%` }}
        role="img"
        aria-label={`${stage.label}: ${stage.count} trials`}
      />
      <p className={cn("m-0 tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {stage.count}
        {stage.percentOfTrialStarts !== null ? ` · ${Math.round(stage.percentOfTrialStarts)}% of trial starts` : null}
        {stage.percentFromPreviousStage !== null && stage.stageId !== "trial-started"
          ? ` · ${Math.round(stage.percentFromPreviousStage)}% from previous stage`
          : null}
      </p>
      {formatPeriodDelta(stage.count, stage.previousPeriodCount) ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {formatPeriodDelta(stage.count, stage.previousPeriodCount)}
        </p>
      ) : null}
    </div>
  );
}

type Props = {
  readonly data: TrialFunnelOperationalSummary | null;
  readonly loadState: LoadState;
  readonly maxStageCount: number;
};

export function TrialFunnelOverviewSection(props: Props): ReactElement {
  const { data, loadState, maxStageCount } = props;
  const trialStarts = data?.signupAttempts30Days ?? 0;
  const cost = data?.firstReviewCost;
  const timing = data?.timing;

  return (
    <>
      {loadState === "ready" && trialStarts === 0 ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          No trials started during the selected period.
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Funnel overview</CardTitle>
        </CardHeader>
        <CardContent className={OPERATOR_LAYOUT.sectionStack}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Active trials</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.kpiValue)}>
                {loadState === "loading" && !data ? "Loading…" : (data?.activeSelfServiceTrials ?? 0)}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Trial starts</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.kpiValue)}>{trialStarts}</p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>First reviews finalized</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.kpiValue)}>
                {data?.firstCommittedReviews30Days ?? 0}
              </p>
            </div>
            <div className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Converted</p>
              <p className={cn("m-0 mt-1 tabular-nums", OPERATOR_TYPOGRAPHY.kpiValue)}>
                {data?.trialConversions30Days ?? 0}
              </p>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{TRIAL_FUNNEL_CONVERSION_NOTE}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4" aria-label="Funnel stage bars">
              {(data?.stages ?? []).map((stage) => {
                const definition = trialFunnelStageDefinition(stage.stageId);

                return (
                  <div key={stage.stageId}>
                    <div className="inline-flex items-center gap-1">
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {stage.label}
                      </p>
                      {definition?.definition ? (
                        <FieldHelpTooltip label={stage.label} hint={definition.definition} />
                      ) : null}
                    </div>
                    <FunnelStageBar stage={stage} maxCount={maxStageCount} />
                  </div>
                );
              })}
            </div>

            <EnterpriseTable ariaLabel="Funnel stages accessible table">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Stage</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Count</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>% of trial starts</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>% from previous</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {(data?.stages ?? []).map((stage) => (
                  <EnterpriseTableRow key={`table-${stage.stageId}`}>
                    <EnterpriseTableCell>{stage.label}</EnterpriseTableCell>
                    <EnterpriseTableCell className="tabular-nums">{stage.count}</EnterpriseTableCell>
                    <EnterpriseTableCell>{formatPercent(stage.percentOfTrialStarts, "trial starts")}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      {stage.stageId === "trial-started"
                        ? " — "
                        : formatPercent(stage.percentFromPreviousStage, "prior-stage completions")}
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Activation and review timing</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Trial start to first review finalized</p>
              <p className="m-0">
                {medianTimingLabel(
                  timing?.medianTrialStartToFirstReviewFinalizedHours ?? null,
                  timing?.medianTrialStartToFirstReviewFinalizedSampleSize ?? null,
                )}
              </p>
            </div>
            <div>
              <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Trial start to conversion</p>
              <p className="m-0">
                {medianTimingLabel(
                  timing?.medianTrialStartToConversionHours ?? null,
                  timing?.medianTrialStartToConversionSampleSize ?? null,
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>First-review AI cost</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {cost?.status === "estimated" ? (
              <>
                <p className="m-0">
                  Median estimated cost:{" "}
                  <span className="tabular-nums font-medium">
                    ${cost.medianEstimatedUsd?.toFixed(2) ?? "Not available"}
                  </span>
                </p>
                <p className="m-0">
                  Observed range:{" "}
                  <span className="tabular-nums">
                    ${cost.lowEstimatedUsd?.toFixed(2) ?? " — "}–${cost.highEstimatedUsd?.toFixed(2) ?? " — "}
                  </span>
                </p>
                <p className="m-0">Sample: {cost.sampleSize} first completed review{cost.sampleSize === 1 ? "" : "s"}</p>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{cost.statusDetail}</p>
              </>
            ) : (
              <p className="m-0">{cost?.statusDetail ?? "No first reviews were completed in the selected cohort."}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
