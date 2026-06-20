import type { ReactElement } from "react";

import { ManifestJsonActions } from "@/components/ManifestJsonActions";
import { CopyIdButton } from "@/components/CopyIdButton";
import {
  OperatorEvidenceLimitsFooter,
  type OperatorEvidenceLimitsExecutionProps,
} from "@/components/OperatorEvidenceLimitsFooter";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { manifestStatusForDisplay } from "@/lib/manifest-status-display";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import type { ManifestSummary } from "@/types/authority";

import { RunDetailFeasibilityVerdictSection } from "./RunDetailFeasibilityVerdictSection";
import { runDetailSectionHeadingClass } from "./run-detail-section-heading";

type RunDetailManifestSummarySectionProps = {
  readonly manifestSummary: ManifestSummary;
  readonly runExecution?: OperatorEvidenceLimitsExecutionProps | null;
  readonly buyerPolishedShell: boolean;
};

export function RunDetailManifestSummarySection(
  props: RunDetailManifestSummarySectionProps,
): ReactElement {
  const { manifestSummary, runExecution, buyerPolishedShell } = props;

  return (
    <section id="manifest-summary" className="scroll-mt-24 space-y-4">
      <Card>
        <CardHeader>
          <h3 className={runDetailSectionHeadingClass}>
            {buyerPolishedShell ? (
              <>Finalized decision record</>
            ) : (
              <>
                Review package summary (<GlossaryTooltip termKey="architecture_manifest">manifest</GlossaryTooltip>)
              </>
            )}
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {manifestSummary.operatorSummary ? (
            <p className="m-0 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {manifestSummary.operatorSummary}
            </p>
          ) : null}
          <dl className="m-0 grid gap-3 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-6">
            {!buyerPolishedShell ? (
              <>
                <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Review ID</dt>
                <dd className="m-0 flex min-w-0 flex-wrap items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
                  <code className="min-w-0 break-all font-mono text-xs">{manifestSummary.runId}</code>
                  <CopyIdButton value={manifestSummary.runId} aria-label="Copy review ID" />
                </dd>
                <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Manifest ID</dt>
                <dd className="m-0 flex min-w-0 flex-wrap items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100">
                  <code className="min-w-0 break-all font-mono text-xs">{manifestSummary.manifestId}</code>
                  <CopyIdButton value={manifestSummary.manifestId} aria-label="Copy review record ID" />
                </dd>
              </>
            ) : null}
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Status</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">
              {manifestStatusForDisplay(manifestSummary.status)}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Policy pack</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100">
              {policyPackBuyerLabel(manifestSummary.ruleSetId, manifestSummary.ruleSetVersion)}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Decisions</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
              {finiteIntegerCountDisplay(manifestSummary.decisionCount)}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {buyerPolishedShell ? "Monitored risks" : "Warnings"}
            </dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
              {finiteIntegerCountDisplay(manifestSummary.warningCount)}
            </dd>
            <dt className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Unresolved issues</dt>
            <dd className="m-0 text-sm text-neutral-900 dark:text-neutral-100 tabular-nums">
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
