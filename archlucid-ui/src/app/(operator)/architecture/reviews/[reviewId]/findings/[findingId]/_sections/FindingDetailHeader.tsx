import { cn } from "@/lib/utils";
import Link from "next/link";

import { FindingCrossReviewLifecycleHint } from "@/components/findings/FindingCrossReviewLifecycleHint";
import { FindingJobViewLaneCallout } from "@/components/findings/FindingJobViewLaneCallout";
import { FindingSeverityConstraintNote } from "@/components/findings/FindingSeverityConstraintNote";
import { FindingPolicyCitationHero } from "@/components/findings/FindingPolicyCitationHero";
import { FindingConfidenceBadge } from "@/components/findings/FindingConfidenceBadge";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GOVERNANCE_FINDINGS_PATH } from "@/lib/governance/governance-route-paths";
import { FINDING_DETAIL_CLAIM_DISCIPLINE } from "@/lib/findings/finding-detail-evidence-copy";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { findingDetailLeadSentence } from "@/lib/findings/finding-display-from-inspect";
import { buildFindingDerivationSentence } from "@/lib/findings/finding-derivation-sentence";
import { findingCausalMiniChainFromInspectPayload } from "@/lib/findings/finding-causal-mini-chain";
import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { FindingCausalMiniChain } from "@/components/usability/FindingCausalMiniChain";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { FindingPolicyEvidenceCitationModel } from "@/lib/findings/finding-policy-evidence-citations";
import type { FindingJobView } from "@/lib/findings/finding-inspect-job-view";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import { FindingDetailWayfinding } from "./FindingDetailWayfinding";
import {
  FINDING_DETAIL_PRIMARY_CONTENT_ID,
  FINDING_DETAIL_SKIP_LINK_LABEL,
} from "./finding-detail-page-copy";
import { findingStatusTagKind } from "./finding-detail-route-display";

export type FindingDetailHeaderProps = {
  readonly showBuyerPolishedBody: boolean;
  readonly buyerPolishedShell: boolean;
  readonly reviewPackageHref: string;
  readonly reviewFindingsHref: string;
  readonly pageTitle: string;
  readonly runId: string;
  readonly decodedFindingId: string;
  readonly crossReviewPriorRunId: string | null;
  readonly crossReviewLaterRunId: string | null;
  readonly inspectPayload: FindingInspectPayload | null;
  readonly policyProvenanceModel: FindingPolicyEvidenceCitationModel | null;
  readonly policyTraceExcerpt: string | null;
  readonly severityRationale: string;
  readonly severityHeadline: string;
  readonly labels: {
    readonly severityLabel: string | null;
    readonly statusLabel: string | null;
    readonly categoryLabel: string | null;
    readonly impactedAreaLabel: string | null;
  } | null;
  readonly confidenceLevel: FindingInspectPayload["confidenceLevel"];
  readonly evaluationScore: number | null;
  readonly severityConstraintNote: string | null;
  readonly findingJobView: FindingJobView | null;
  readonly graphEvidenceHref: string | null;
  readonly inspectHref: string;
};

/** Finding detail header: wayfinding, buyer hero, or operator page header. */
export function FindingDetailHeader(props: FindingDetailHeaderProps) {
  const {
    showBuyerPolishedBody,
    buyerPolishedShell,
    reviewPackageHref,
    reviewFindingsHref,
    pageTitle,
    runId,
    decodedFindingId,
    crossReviewPriorRunId,
    crossReviewLaterRunId,
    inspectPayload,
    policyProvenanceModel,
    policyTraceExcerpt,
    severityRationale,
    severityHeadline,
    labels,
    confidenceLevel,
    evaluationScore,
    severityConstraintNote,
    findingJobView,
    graphEvidenceHref,
    inspectHref,
  } = props;

  return (
    <>
      {showBuyerPolishedBody ? (
        <a
          href={`#${FINDING_DETAIL_PRIMARY_CONTENT_ID}`}
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-blue-600 dark:focus:bg-neutral-900"
        >
          {FINDING_DETAIL_SKIP_LINK_LABEL}
        </a>
      ) : null}
      <FindingDetailWayfinding
        reviewPackageHref={reviewPackageHref}
        reviewFindingsHref={reviewFindingsHref}
        currentPageLabel={pageTitle}
      />
      <FindingCrossReviewLifecycleHint
        runId={runId}
        findingId={decodedFindingId}
        priorRunId={crossReviewPriorRunId}
        laterRunId={crossReviewLaterRunId}
      />
      {inspectPayload !== null && !buyerPolishedShell ? (
        <div className="space-y-2" data-testid="finding-detail-derivation-causal">
          <FindingDerivationLine
            derivation={buildFindingDerivationSentence({
              ruleName: inspectPayload.decisionRuleName,
              ruleId: inspectPayload.decisionRuleId,
              severityLabel: severityHeadline,
              evidenceRefCount: inspectPayload.evidence?.length ?? 0,
              reasoningSummary: inspectPayload.reasoningSummary,
            })}
            evidenceHref={inspectHref}
          />
          <FindingCausalMiniChain chain={findingCausalMiniChainFromInspectPayload(inspectPayload)} />
        </div>
      ) : null}
      {!buyerPolishedShell ? (
        <OperatorPageHeader
          navHref={GOVERNANCE_FINDINGS_PATH}
          title={pageTitle}
          headingLevel="h1"
          breadcrumb={<p className={cn("m-0 text-al-text-secondary", OPERATOR_NAV_GROUP_LABEL)}>Finding detail</p>}
          claimDiscipline={FINDING_DETAIL_CLAIM_DISCIPLINE}
          claimDisciplineTestId="finding-detail-claim-discipline"
        >
          {policyProvenanceModel !== null &&
          (policyProvenanceModel.pack !== null || policyProvenanceModel.policy !== null) ? (
            <FindingPolicyCitationHero model={policyProvenanceModel} traceExcerpt={policyTraceExcerpt} />
          ) : null}

          {labels !== null ? (
            <div className="flex flex-wrap items-center gap-2">
              {labels.severityLabel ? <SeverityTag severity={labels.severityLabel} /> : null}
              {labels.statusLabel ? (
                <StatusTag kind={findingStatusTagKind(labels.statusLabel)} label={labels.statusLabel} />
              ) : null}
              {labels.categoryLabel ? <StatusTag kind="neutral" label={labels.categoryLabel} /> : null}
              {labels.impactedAreaLabel ? (
                <StatusTag kind="neutral" label={`Business impact: ${labels.impactedAreaLabel}`} />
              ) : null}
            </div>
          ) : null}

          {inspectPayload !== null &&
          (confidenceLevel === "High" || confidenceLevel === "Medium" || confidenceLevel === "Low") ? (
            <div className="flex flex-wrap items-center gap-2">
              <FindingConfidenceBadge level={confidenceLevel} />
              {evaluationScore !== null && Number.isFinite(evaluationScore) ? (
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Score {evaluationScore.toFixed(2)}
                </span>
              ) : null}
            </div>
          ) : null}

          {inspectPayload !== null && severityRationale.length > 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}>
              {severityRationale}
            </p>
          ) : null}

          {severityConstraintNote !== null ? <FindingSeverityConstraintNote note={severityConstraintNote} /> : null}

          {findingJobView !== null ? <FindingJobViewLaneCallout jobView={findingJobView} runId={runId} /> : null}

          {graphEvidenceHref !== null ? (
            <p className="m-0">
              <Link className={OPERATOR_LINK.nav} href={graphEvidenceHref}>
                View evidence trail
              </Link>
            </p>
          ) : null}

          {inspectPayload !== null ? (
            <p className={cn("m-0 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {findingDetailLeadSentence(inspectPayload)}
            </p>
          ) : null}
        </OperatorPageHeader>
      ) : null}
    </>
  );
}
