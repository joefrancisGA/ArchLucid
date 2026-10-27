import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { ReactElement } from "react";

import { AiOutputGovernanceLabel } from "@/components/AiOutputGovernanceLabel";
import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { FindingAskInlinePanel } from "@/components/findings/FindingAskInlinePanel";
import { FindingConfidenceBadge } from "@/components/findings/FindingConfidenceBadge";
import { FindingFeedbackThumbs } from "@/components/findings/FindingFeedbackThumbs";
import { FindingDidNotThinkOfThatButton } from "@/components/findings/FindingDidNotThinkOfThatButton";
import { FindingSemanticSupportBandChip } from "@/components/findings/FindingSemanticSupportBandChip";
import { FindingClassificationChip } from "@/components/findings/FindingClassificationChip";
import { FindingTrustChip } from "@/components/findings/FindingTrustChip";
import { INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE } from "@/lib/findings/insight-density-band";
import { isDecisionGradeFinding } from "@/lib/findings/review-detail-findings-classification-band";
import { FindingPolicyCitationProminentStrip } from "@/components/findings/FindingPolicyCitationProminentStrip";
import { FindingPolicyEvidenceCitationLinks } from "@/components/findings/FindingPolicyEvidenceCitationLinks";
import { FindingCreateWorkItemActions } from "@/components/work-items/FindingCreateWorkItemActions";
import { ItsmOutboundQuickActions } from "@/components/itsm/ItsmOutboundQuickActions";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { FindingEvidenceRefSnippets } from "@/components/usability/FindingEvidenceRefSnippets";
import { FindingInsightDensityDisclosure } from "@/components/usability/FindingInsightDensityDisclosure";
import { Button } from "@/components/ui/button";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { findingEnforcementTierLabel } from "@/lib/findings/finding-enforcement-tier";
import { formatQuickDecisionEvaluationTraceLabel } from "@/lib/findings/finding-evaluation-trace-copy";
import { buildFindingPolicyEvidenceCitationsFromQuickDecision } from "@/lib/findings/finding-policy-evidence-citations";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";
import {
  buildQuickDecisionFindingEvidenceLinks,
  quickDecisionRecommendationSnippet,
  quickDecisionWorkItemSeverityLabel,
} from "@/lib/quick-decision-finding-links";
import {
  formatQuickDecisionConfidenceWorkspaceLabel,
  formatQuickDecisionFindingOwnerDisplay,
  isKnownQuickDecisionConfidenceLevel,
} from "@/lib/findings/quick-decision-finding-display";
import {
  findingHasNoSourceEvidence,
  findingHasMissingEvidenceRefCount,
  findingHasStoredZeroEvidenceRefCount,
  humanReviewStatusDisplay,
  severityBadgeLabel,
  severityKindFromNumericValue,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { QuickDecisionSummaryProps } from "./types";

function formatQuickDecisionEvaluationScoreLine(score: number): string {
  return `Evaluation score was stored as ${score}. The score unit or scale was not stored with this value.`;
}

type QuickDecisionSummaryFindingRowProps = {
  readonly props: QuickDecisionSummaryProps;
  readonly finding: QuickDecisionFinding;
  readonly showTierBadge: boolean;
  readonly subdued?: boolean;
  readonly canMutate: boolean;
  readonly askFindingId: string | null;
  readonly onToggleAskPanel: (finding: QuickDecisionFinding) => void;
  readonly onViewReasoning: (finding: QuickDecisionFinding) => void;
  readonly onMute: (finding: QuickDecisionFinding) => void;
};

export function QuickDecisionSummaryFindingRow({
  props,
  finding,
  showTierBadge,
  subdued = false,
  canMutate,
  askFindingId,
  onToggleAskPanel,
  onViewReasoning,
  onMute,
}: QuickDecisionSummaryFindingRowProps): ReactElement {
  const findingIdTrimmed = finding.findingId.trim();
  const hasStoredFindingId = findingIdTrimmed.length > 0;
  const href = hasStoredFindingId ? getFindingDetailHref(props.runId, findingIdTrimmed) : null;
  const snippet = quickDecisionRecommendationSnippet(finding);
  const badgeLabel = severityBadgeLabel(finding.severityValue);
  const { evidenceRefCount, viewEvidenceHref } = buildQuickDecisionFindingEvidenceLinks(props.runId, finding);
  const citationModel = buildFindingPolicyEvidenceCitationsFromQuickDecision(props.runId, finding);
  const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);
  const ownerDisplay = formatQuickDecisionFindingOwnerDisplay(finding.assignedToUserId);
  const workspaceCardMode = props.workspaceCardMode === true;
  const findingTitleDisplay =
    finding.title.trim().length > 0 ? finding.title : "Finding title was not stored.";

  const rowBody = (
    <>
      {citationModel.pack !== null || citationModel.policy !== null ? (
        <FindingPolicyCitationProminentStrip
          pack={citationModel.pack}
          policy={citationModel.policy}
          compact
          className="mb-2"
        />
      ) : null}
      <div className="flex flex-wrap items-start gap-2">
        {!workspaceCardMode ? (
          <SeverityTag
            severity={badgeLabel}
            kind={severityKindFromNumericValue(finding.severityValue)}
            label={badgeLabel}
            className="shrink-0 tabular-nums"
          />
        ) : null}
        {showTierBadge ? (
          <StatusTag kind="neutral" label={findingEnforcementTierLabel(finding.enforcementTier)} className="shrink-0" />
        ) : null}
        {isKnownQuickDecisionConfidenceLevel(finding.confidenceLevel) ? (
          <FindingConfidenceBadge level={finding.confidenceLevel} />
        ) : (
          <span className="text-al-text-secondary text-sm">
            {formatQuickDecisionConfidenceWorkspaceLabel(finding.confidenceLevel)}
          </span>
        )}
        <AiOutputGovernanceLabel findingId={finding.findingId} />
        <FindingTrustChip finding={finding} />
        <FindingClassificationChip
          classification={finding.classification}
          treatment={finding.treatment}
          findingId={finding.findingId}
          showReason
        />
        <FindingSemanticSupportBandChip finding={finding} showReason />
        {findingHasMissingEvidenceRefCount(finding) ? (
          <StatusTag
            kind="neutral"
            label="Evidence ref count was not stored"
            data-testid={`finding-evidence-ref-count-missing-${finding.findingId}`}
          />
        ) : findingHasStoredZeroEvidenceRefCount(finding) ? (
          <StatusTag
            kind="neutral"
            label="Evidence refs were stored as zero"
            data-testid={`finding-evidence-ref-count-zero-${finding.findingId}`}
          />
        ) : findingHasNoSourceEvidence(finding) ? (
          <StatusTag
            kind="needs-attention"
            label="Evidence gap"
            data-testid={`finding-evidence-gap-${finding.findingId}`}
          />
        ) : null}
        {!workspaceCardMode && reviewStatus !== null ? (
          <StatusTag
            kind={reviewStatus.statusKind}
            label={reviewStatus.label}
            data-testid={`finding-review-status-${finding.findingId}`}
          />
        ) : null}
        {finding.isMuted ? <StatusTag kind="neutral" label="Muted" className="shrink-0" /> : null}
        {!workspaceCardMode ? (
          hasStoredFindingId && href !== null ? (
            <Link href={href} prefetch={false} className={cn(OPERATOR_LINK.nav, "min-w-0 flex-1")}>
              <span className="sr-only">Finding {findingIdTrimmed}: </span>
              {findingTitleDisplay}
            </Link>
          ) : (
            <span className={cn("min-w-0 flex-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Finding id was not stored.
            </span>
          )
        ) : (
          <span className={cn("min-w-0 flex-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            {findingTitleDisplay}
          </span>
        )}
        {viewEvidenceHref !== null ? (
          <FindingEvidenceLinkChip
            href={viewEvidenceHref}
            evidenceRefCount={evidenceRefCount}
            className="shrink-0"
          />
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("h-8 shrink-0", OPERATOR_TYPOGRAPHY.button)}
          onClick={() => {
            onViewReasoning(finding);
          }}
        >
          View AI reasoning
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn("h-8 shrink-0", OPERATOR_TYPOGRAPHY.button)}
          onClick={() => {
            onToggleAskPanel(finding);
          }}
          aria-pressed={askFindingId === finding.findingId}
          title="Ask about this finding"
        >
          <MessageCircle className="mr-1 h-3.5 w-3.5" aria-hidden />
          Ask
        </Button>
        {finding.iacStub !== null && finding.iacStub !== undefined && finding.iacStub.length > 0 ? (
          <StatusTag kind="neutral" label="AI-generated IaC stub" className="shrink-0" />
        ) : null}
        {canMutate && !finding.isMuted ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className={cn("h-8 shrink-0", OPERATOR_TYPOGRAPHY.button)}
            title="Hide this finding from the default list for this review"
            onClick={() => {
              onMute(finding);
            }}
          >
            Mute
          </Button>
        ) : null}
        {canMutate ? <FindingFeedbackThumbs runId={props.runId} findingId={finding.findingId} compact /> : null}
        {canMutate ? (
          <FindingDidNotThinkOfThatButton runId={props.runId} findingId={finding.findingId} compact />
        ) : null}
      </div>
      {isDecisionGradeFinding(finding) ? (
        <p
          className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`quick-decision-density-honesty-${finding.findingId}`}
        >
          {INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE}
        </p>
      ) : null}
      <p
        className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        data-testid={`quick-decision-evaluation-trace-${finding.findingId}`}
      >
        Evaluation trace: {formatQuickDecisionEvaluationTraceLabel(finding.traceConfidenceLabel)}
      </p>
      {finding.evaluationConfidenceScore !== null &&
      finding.evaluationConfidenceScore !== undefined &&
      Number.isFinite(finding.evaluationConfidenceScore) ? (
        <p className={cn("m-0 mt-0.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {formatQuickDecisionEvaluationScoreLine(finding.evaluationConfidenceScore)}
        </p>
      ) : finding.evaluationConfidenceScore === null || finding.evaluationConfidenceScore === undefined ? (
        <p className={cn("m-0 mt-0.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Evaluation score was not stored
        </p>
      ) : null}
      {workspaceCardMode || snippet.length > 0 ? (
        <p className={cn("m-0 mt-1 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Recommended action: </span>
          <span>{snippet}</span>
        </p>
      ) : null}
      {!workspaceCardMode ? (
        <p
          className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`finding-owner-${finding.findingId}`}
        >
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Owner: </span>
          {ownerDisplay}
        </p>
      ) : null}
      <FindingPolicyEvidenceCitationLinks model={citationModel} compact className="mt-2" />
      {finding.evidenceRefSnippets !== undefined && finding.evidenceRefSnippets.length > 0 ? (
        <FindingEvidenceRefSnippets snippets={finding.evidenceRefSnippets} />
      ) : (evidenceRefCount ?? 0) > 0 ? (
        <p
          className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`finding-evidence-ref-snippets-missing-${finding.findingId}`}
        >
          Evidence ref excerpts were not stored.
        </p>
      ) : null}
      {(finding.insightDensityScore !== null && finding.insightDensityScore !== undefined) ||
      (finding.whyThisIsNotGeneric !== null &&
        finding.whyThisIsNotGeneric !== undefined &&
        finding.whyThisIsNotGeneric.length > 0) ? (
        <FindingInsightDensityDisclosure
          insightDensityScore={finding.insightDensityScore ?? null}
          whyThisIsNotGeneric={finding.whyThisIsNotGeneric ?? null}
          className="mt-2"
        />
      ) : null}
      {!workspaceCardMode ? (
        <div
          className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800"
          data-testid={`finding-itsm-sync-${finding.findingId}`}
        >
          {props.packageCommitted === false ? null : props.providerNeutralWorkItems === true &&
            props.architectureWorkItemContext ? (
            <FindingCreateWorkItemActions
              runId={props.runId}
              finding={finding}
              architectureName={props.architectureWorkItemContext.architectureName}
              architectureOverview={props.architectureWorkItemContext.architectureOverview}
              ownerLabel={props.architectureWorkItemContext.ownerLabel}
              allFindings={props.findings}
            />
          ) : (
            <>
              <p className={cn("m-0 mb-1", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
                Jira / ServiceNow
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <CopyGovernanceQueueWorkItemButton
                  runId={props.runId}
                  findingId={finding.findingId}
                  findingTitle={finding.title}
                  severityLabel={quickDecisionWorkItemSeverityLabel(finding.severityValue)}
                  recommendedAction={finding.recommendation}
                  statusLabel={
                    finding.humanReviewStatus === null || finding.humanReviewStatus === undefined
                      ? null
                      : humanReviewStatusDisplay(finding.humanReviewStatus).label
                  }
                  compact
                />
                <ItsmOutboundQuickActions findingId={finding.findingId} compact />
              </div>
            </>
          )}
        </div>
      ) : null}
      {askFindingId === finding.findingId ? (
        <div className="mt-3">
          <FindingAskInlinePanel
            findingId={finding.findingId}
            defaultOpen
            semanticSupportBand={finding.semanticSupportBand ?? null}
          />
        </div>
      ) : null}
    </>
  );

  return (
    <li
      key={finding.findingId}
      className={cn("pl-1", subdued ? "opacity-80" : undefined)}
      data-testid={subdued ? `quick-decision-low-confidence-${finding.findingId}` : undefined}
    >
      {rowBody}
    </li>
  );
}
