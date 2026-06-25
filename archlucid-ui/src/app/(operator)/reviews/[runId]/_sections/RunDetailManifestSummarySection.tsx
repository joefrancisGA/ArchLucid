"use client";

import type { ReactElement } from "react";

import { ManifestJsonActions } from "@/components/ManifestJsonActions";
import { CopyIdButton } from "@/components/CopyIdButton";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/OperatorEvidenceLimitsFooter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { CORE_PILOT_PATH_STREAMLINED_LABELS, isStreamlinedCorePilotPath } from "@/lib/core-pilot-path-vocabulary";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ManifestSummary } from "@/types/authority";

import { RunDetailFeasibilityVerdictSection } from "./RunDetailFeasibilityVerdictSection";
import { RunDetailManifestSummaryHeading } from "./RunDetailManifestSummaryHeading";

type RunDetailManifestSummarySectionProps = {
  readonly manifestSummary: ManifestSummary;
  readonly runExecution?: OperatorEvidenceLimitsExecutionProps | null;
  readonly buyerPolishedShell: boolean;
};

export function RunDetailManifestSummarySection(
  props: RunDetailManifestSummarySectionProps,
): ReactElement {
  const { manifestSummary, runExecution, buyerPolishedShell } = props;
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const evaluationStandardsLabel = isStreamlinedCorePilotPath(hasCommittedArchitectureReview)
    ? CORE_PILOT_PATH_STREAMLINED_LABELS.evaluationStandards
    : "Policy pack";
  const definitionLabelClass = cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.body);
  const definitionValueClass = cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.body);
  const monoValueClass = cn("min-w-0 break-all font-mono", OPERATOR_TYPOGRAPHY.micro);

  return (
    <section id="manifest-summary" className="scroll-mt-24 space-y-4">
      <Card>
        <CardHeader>
          <RunDetailManifestSummaryHeading buyerPolishedShell={buyerPolishedShell} />
        </CardHeader>
        <CardContent className="space-y-4">
          {manifestSummary.operatorSummary ? (
            <p className={cn("m-0 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {manifestSummary.operatorSummary}
            </p>
          ) : null}
          <dl className="m-0 grid gap-3 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-6">
            {!buyerPolishedShell ? (
              <>
                <dt className={definitionLabelClass}>Review ID</dt>
                <dd className={cn("m-0 flex min-w-0 flex-wrap items-center gap-2", definitionValueClass)}>
                  <code className={monoValueClass}>{manifestSummary.runId}</code>
                  <CopyIdButton value={manifestSummary.runId} aria-label="Copy review ID" />
                </dd>
                <dt className={definitionLabelClass}>Review record ID</dt>
                <dd className={cn("m-0 flex min-w-0 flex-wrap items-center gap-2", definitionValueClass)}>
                  <code className={monoValueClass}>{manifestSummary.manifestId}</code>
                  <CopyIdButton value={manifestSummary.manifestId} aria-label="Copy review record ID" />
                </dd>
              </>
            ) : null}
            <dt className={definitionLabelClass}>Status</dt>
            <dd className={cn("m-0", definitionValueClass)}>
              {manifestStatusForDisplay(manifestSummary.status)}
            </dd>
            <dt className={definitionLabelClass}>{evaluationStandardsLabel}</dt>
            <dd className={cn("m-0", definitionValueClass)}>
              {policyPackBuyerLabel(manifestSummary.ruleSetId, manifestSummary.ruleSetVersion)}
            </dd>
            <dt className={definitionLabelClass}>Decisions</dt>
            <dd className={cn("m-0 tabular-nums", definitionValueClass)}>
              {finiteIntegerCountDisplay(manifestSummary.decisionCount)}
            </dd>
            <dt className={definitionLabelClass}>
              {buyerPolishedShell ? "Monitored risks" : "Warnings"}
            </dt>
            <dd className={cn("m-0 tabular-nums", definitionValueClass)}>
              {finiteIntegerCountDisplay(manifestSummary.warningCount)}
            </dd>
            <dt className={definitionLabelClass}>Unresolved issues</dt>
            <dd className={cn("m-0 tabular-nums", definitionValueClass)}>
              {finiteIntegerCountDisplay(manifestSummary.unresolvedIssueCount)}
            </dd>
          </dl>
          <ManifestJsonActions runId={manifestSummary.runId} />
        </CardContent>
      </Card>

      {manifestSummary.feasibilityVerdict !== undefined && manifestSummary.feasibilityVerdict !== null ? (
        <RunDetailFeasibilityVerdictSection
          verdict={manifestSummary.feasibilityVerdict}
          runId={manifestSummary.runId}
        />
      ) : null}

      <OperatorEvidenceLimitsFooter
        runId={manifestSummary.runId}
        execution={runExecution ?? null}
        showArchitectureReviewSummaryLink
      />
    </section>
  );
}
