import { cn } from "@/lib/utils";

import { CtoDemoAuditIntegrityVerifyButton } from "@/components/cto-demo/CtoDemoAuditIntegrityVerifyButton";
import { RunDetailPageHeader, type RunDetailPageHeaderProps } from "@/components/runs/RunDetailPageHeader";
import { ReviewPackageEvidenceDensityStrip } from "@/components/usability/ReviewPackageEvidenceDensityStrip";
import { ReviewPackagePlainSummary } from "@/components/usability/ReviewPackagePlainSummary";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  resolveReviewPackageAttentionLine,
  type ResolveReviewPackageAttentionLineInput,
} from "./resolve-review-package-attention-line";
import type { ReviewPackageSummaryMode } from "./resolve-review-package-summary-mode";
import { ReviewPackagePrimaryAction } from "./ReviewPackagePrimaryAction";
import type { ReviewPackagePrimaryAction as ReviewPackagePrimaryActionModel } from "./resolve-review-package-primary-action";

export type ReviewPackagePlainSummarySlice = {
  readonly blockingFindingCount: number;
  readonly advisoryFindingCount: number;
  readonly overallRiskLabel: string;
};

export type ReviewPackageEvidenceDensitySlice = {
  readonly findingCount: number | null;
  readonly evidenceArtifactCount: number;
  readonly policiesCheckedLabel: string | null;
  readonly governanceApprovalLabel: string | null;
  readonly auditTrailHref: string;
};

export type ReviewPackageSummaryHeaderProps = {
  readonly mode: ReviewPackageSummaryMode;
  readonly pageHeader: RunDetailPageHeaderProps;
  readonly plainSummary: ReviewPackagePlainSummarySlice | null;
  readonly evidenceDensity: ReviewPackageEvidenceDensitySlice | null;
  readonly outcomeCards: React.ReactNode;
  readonly attentionLineInput: ResolveReviewPackageAttentionLineInput;
  readonly showCtoDemoAuditButton: boolean;
  readonly primaryAction: ReviewPackagePrimaryActionModel;
  readonly primaryActionRunId: string;
  readonly primaryActionHasGoldenManifest: boolean;
  readonly primaryActionCommitBlockedReason: string | null | undefined;
  readonly demoteHeaderFinalizeButton: boolean;
};

/**
 * Single summary/header layer for Review Package detail — composes the former four
 * stacked widgets so reviewers read one mental model instead of re-assembling four cards.
 */
export function ReviewPackageSummaryHeader(props: ReviewPackageSummaryHeaderProps): React.JSX.Element {
  const attentionLine = resolveReviewPackageAttentionLine(props.attentionLineInput);

  return (
    <section
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="review-package-summary-header"
      data-review-package-summary-mode={props.mode}
      aria-label={props.mode === "finalized" ? "Review summary" : "Review in progress"}
    >
      <RunDetailPageHeader
        {...props.pageHeader}
        demoteFinalizeButton={props.demoteHeaderFinalizeButton}
      />

      <ReviewPackagePrimaryAction
        action={props.primaryAction}
        runId={props.primaryActionRunId}
        hasGoldenManifest={props.primaryActionHasGoldenManifest}
        commitBlockedReason={props.primaryActionCommitBlockedReason}
      />

      {attentionLine !== null ? (
        <p
          className={cn("m-0 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="review-package-attention-line"
          role="status"
        >
          {attentionLine}
        </p>
      ) : null}

      {props.mode === "finalized" && props.plainSummary !== null ? (
        <ReviewPackagePlainSummary {...props.plainSummary} />
      ) : null}

      {props.mode === "finalized" && props.evidenceDensity !== null ? (
        <div className="flex flex-wrap items-center gap-3">
          <ReviewPackageEvidenceDensityStrip className="min-w-0 flex-1" {...props.evidenceDensity} />
          {props.showCtoDemoAuditButton ? <CtoDemoAuditIntegrityVerifyButton /> : null}
        </div>
      ) : null}

      {props.outcomeCards}
    </section>
  );
}
