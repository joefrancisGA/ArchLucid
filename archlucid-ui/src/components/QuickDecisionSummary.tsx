"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useMemo } from "react";
import type { ReactElement } from "react";

import {
  ARCHITECTURE_CREATED_FINDINGS_FINALIZE_ELIGIBLE_EMPTY,
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK,
  ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY,
} from "@/lib/architecture-created-findings-sources";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture-workspace-tabs";

import { FindingAiReasoningDialog } from "@/components/FindingAiReasoningDialog";
import { AiOutputGovernanceLabel } from "@/components/AiOutputGovernanceLabel";
import { FindingPolicyCitationProminentStrip } from "@/components/findings/FindingPolicyCitationProminentStrip";
import { FindingsItsmExportToolbar } from "@/components/FindingsItsmExportToolbar";
import { CopyGovernanceQueueWorkItemButton } from "@/components/CopyFindingAsWorkItemButton";
import { ItsmOutboundQuickActions } from "@/components/ItsmOutboundQuickActions";
import { FindingCreateWorkItemActions } from "@/components/work-items/FindingCreateWorkItemActions";
import { FindingAskInlinePanel } from "@/components/FindingAskInlinePanel";
import { FindingConfidenceBadge } from "@/components/FindingConfidenceBadge";
import { FindingTrustChip } from "@/components/FindingTrustChip";
import {
  aggregateFindingProvenance,
  formatFindingProvenanceAggregateLine,
} from "@/lib/finding-provenance-display";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import { FindingEvidenceRefSnippets } from "@/components/usability/FindingEvidenceRefSnippets";
import { FindingPolicyEvidenceCitationLinks } from "@/components/findings/FindingPolicyEvidenceCitationLinks";
import { ReviewDetailPolicyPackFindingsBreakdown } from "@/components/findings/ReviewDetailPolicyPackFindingsBreakdown";
import { FindingInsightDensityDisclosure } from "@/components/usability/FindingInsightDensityDisclosure";
import { QuickDecisionAdditionalFindingsList } from "@/components/QuickDecisionAdditionalFindingsList";
import { FindingFeedbackThumbs } from "@/components/FindingFeedbackThumbs";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickDecisionFindingMuteDialog } from "@/components/findings/QuickDecisionFindingMuteDialog";
import { QuickDecisionWorkspacePrimaryFindingCard } from "@/components/findings/QuickDecisionWorkspacePrimaryFindingCard";
import { QuickDecisionWorkspaceSecondaryFindingCard } from "@/components/findings/QuickDecisionWorkspaceSecondaryFindingCard";
import type {
  QuickDecisionWorkItemContext,
  QuickDecisionWorkspaceCardContext,
} from "@/components/findings/QuickDecisionWorkspaceFindingSupportingDetails";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOptionallyControlledBoolean } from "@/hooks/use-optionally-controlled-boolean";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";
import { getFindingDetailHref } from "@/lib/finding-evidence-navigation";
import {
  buildQuickDecisionFindingEvidenceLinks,
  quickDecisionRecommendationSnippet,
  quickDecisionWorkItemSeverityLabel,
} from "@/lib/quick-decision-finding-links";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  buildWorkspaceCardRenderedFindings,
  findingHasNoSourceEvidence,
  humanReviewStatusDisplay,
  partitionQuickDecisionFindings,
  severityBadgeLabel,
  severityKindFromNumericValue,
  sortQuickDecisionFindings,
} from "@/lib/quick-decision-summary-derive";
import { StatusTag } from "@/components/ui/status-tag";
import { SeverityTag } from "@/components/ui/severity-tag";
import { findingEnforcementTierLabel } from "@/lib/finding-enforcement-tier";
import { buildFindingPolicyEvidenceCitationsFromQuickDecision } from "@/lib/finding-policy-evidence-citations";
import {
  groupQuickDecisionFindingsByPolicyPack,
  summarizePolicyPackFindingImpact,
} from "@/lib/group-findings-by-policy-pack";
import {
  formatHiddenLowConfidenceHint,
  partitionQuickDecisionFindingsByConfidence,
} from "@/lib/finding-confidence-filter";
import {
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";

export type QuickDecisionSummaryConfidenceVisibility = {
  readonly showLowConfidence: boolean;
  readonly onShowLowConfidenceChange: (value: boolean) => void;
  readonly hiddenByConfidenceCount: number;
  readonly managedExternally: true;
};

export type QuickDecisionSummaryAdvisoryVisibility = {
  readonly showAdvisory: boolean;
  readonly onShowAdvisoryChange: (value: boolean) => void;
  readonly managedExternally: true;
};

export type QuickDecisionSummaryProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  /** When true and headline counts disagree with extracted findings, show a finalized-review-safe narrative (buyer shell). */
  readonly buyerPolishedShell?: boolean;
  readonly headlineFindingCount?: number | null;
  readonly headlineWarningCount?: number | null;
  /** When true, rows were derived from explanation traces because agent results were empty on the authority payload. */
  readonly usingExplanationFallback?: boolean;
  readonly manifestRuleSetId?: string | null;
  readonly manifestRuleSetVersion?: string | null;
  /** Workspace layout: collapsible finding cards with critical/high expanded by default. */
  readonly workspaceCardMode?: boolean;
  readonly defaultExpandLowSeverity?: boolean;
  /** Architecture-creation review detail: provider-neutral work item affordance instead of Jira-biased copy controls. */
  readonly providerNeutralWorkItems?: boolean;
  readonly architectureWorkItemContext?: QuickDecisionWorkItemContext | null;
  /** When false, hide work-item / ITSM integration chrome until a committed manifest exists (TB-1854). */
  readonly packageCommitted?: boolean;
  /** When set, confidence filtering is owned by the parent (review detail findings workspace). */
  readonly confidenceVisibility?: QuickDecisionSummaryConfidenceVisibility;
  /** When set, advisory-note expansion is owned by the parent (review detail findings workspace). */
  readonly advisoryVisibility?: QuickDecisionSummaryAdvisoryVisibility;
  /** Create-home: assessment pipeline stages finished (distinct from in-flight tracker). */
  readonly analysisStagesComplete?: boolean;
  /** Create-home: navigate to Activity tab from in-progress empty state. */
  readonly onNavigateActivity?: () => void;
  /**
   * When the parent already applied toolbar/confidence filters to `findings`, pass the
   * unfiltered source length so create-home empty states do not fire on filtered-empty lists.
   */
  readonly sourceFindingsCount?: number;
};

/** Top severity-ranked actionable findings from run detail agent results (no extra API calls). */
export function QuickDecisionSummary(props: QuickDecisionSummaryProps): ReactElement {
  const canMutate = useOperateCapability();
  const sorted = sortQuickDecisionFindings(props.findings);
  const confidenceManagedExternally = props.confidenceVisibility?.managedExternally === true;
  const [showMuted, setShowMuted] = useState(false);
  const [showLowConfidence, setShowLowConfidence] = useOptionallyControlledBoolean(
    confidenceManagedExternally && props.confidenceVisibility
      ? {
          value: props.confidenceVisibility.showLowConfidence,
          onChange: props.confidenceVisibility.onShowLowConfidenceChange,
          managedExternally: true,
        }
      : undefined,
  );
  const advisoryManagedExternally = props.advisoryVisibility?.managedExternally === true;
  const [showAdvisory, setShowAdvisory] = useOptionallyControlledBoolean(
    advisoryManagedExternally && props.advisoryVisibility
      ? {
          value: props.advisoryVisibility.showAdvisory,
          onChange: props.advisoryVisibility.onShowAdvisoryChange,
          managedExternally: true,
        }
      : undefined,
  );
  const afterMuteFilter = showMuted ? sorted : sorted.filter((f) => !f.isMuted);
  const confidencePartition = confidenceManagedExternally
    ? {
        trustedFindings: afterMuteFilter,
        lowConfidenceFindings: [] as QuickDecisionFinding[],
      }
    : partitionQuickDecisionFindingsByConfidence(afterMuteFilter);
  const { trustedFindings, lowConfidenceFindings } = confidencePartition;
  const hiddenLowConfidenceCount = confidenceManagedExternally
    ? (props.confidenceVisibility?.hiddenByConfidenceCount ?? 0)
    : showLowConfidence
      ? 0
      : lowConfidenceFindings.length;
  const hiddenLowConfidenceHint = formatHiddenLowConfidenceHint(hiddenLowConfidenceCount);
  const { policyViolations, advisoryNotes } = partitionQuickDecisionFindings(trustedFindings);
  const {
    policyViolations: lowConfidencePolicyViolations,
    advisoryNotes: lowConfidenceAdvisoryNotes,
  } = partitionQuickDecisionFindings(lowConfidenceFindings);
  const topGroups = groupQuickDecisionFindingsByPolicyPack(
    policyViolations,
    props.manifestRuleSetId,
    props.manifestRuleSetVersion,
  );
  const policyPackImpact = summarizePolicyPackFindingImpact(
    afterMuteFilter,
    props.manifestRuleSetId,
    props.manifestRuleSetVersion,
  );
  const policyPackSummary = policyPackImpact.groups;
  const hasSourceFindings =
    typeof props.sourceFindingsCount === "number"
      ? props.sourceFindingsCount > 0
      : props.findings.length > 0;
  const itsmFindingIds = useMemo(
    () => props.findings.map((finding) => finding.findingId),
    [props.findings],
  );
  usePrefetchItsmFindingCorrelations(
    itsmFindingIds,
    props.packageCommitted !== false && props.workspaceCardMode !== true,
  );
  const provenanceAggregateLine = formatFindingProvenanceAggregateLine(
    aggregateFindingProvenance(
      props.findings.map((finding) => ({
        trustLabel: finding.trustLabel,
        policyRuleId: finding.policyRuleId,
        evidenceRefCount: finding.evidenceRefCount,
        confidenceLevel: finding.confidenceLevel,
      })),
    ),
  );
  const buyerPolishedShell = props.buyerPolishedShell === true;
  const headlineFindingCount = props.headlineFindingCount;
  const headlineWarningCount = props.headlineWarningCount;
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [activeReasoning, setActiveReasoning] = useState<QuickDecisionFinding | null>(null);
  const [muteOpen, setMuteOpen] = useState(false);
  const [muteTarget, setMuteTarget] = useState<QuickDecisionFinding | null>(null);
  const [askFindingId, setAskFindingId] = useState<string | null>(null);

  function handleMuteDialogOpenChange(open: boolean): void {
    setMuteOpen(open);

    if (!open) {
      setMuteTarget(null);
    }
  }

  function openMuteDialog(finding: QuickDecisionFinding): void {
    setMuteTarget(finding);
    setMuteOpen(true);
  }

  function renderEmptySummary(): ReactElement {
    if (
      buyerPolishedShell &&
      typeof headlineFindingCount === "number" &&
      Number.isFinite(headlineFindingCount) &&
      Math.trunc(headlineFindingCount) > 0
    ) {
      const n = Math.trunc(headlineFindingCount);
      const warningN =
        typeof headlineWarningCount === "number" && Number.isFinite(headlineWarningCount)
          ? Math.trunc(headlineWarningCount)
          : 0;

      const warningPhrase =
        warningN > 0
          ? " One monitored PHI minimization risk remains in this review record—review severity and controls below."
          : "";

      return (
        <p className="m-0 text-neutral-600 dark:text-neutral-400">
          {`This finalized review records ${n} finding${n === 1 ? "" : "s"} with no unresolved blocking issues.`}
          {warningPhrase}
        </p>
      );
    }

    if (props.packageCommitted === false) {
      if (props.analysisStagesComplete === true) {
        return (
          <p
            className="m-0 text-neutral-600 dark:text-neutral-400"
            data-testid="quick-decision-create-home-finalize-empty"
          >
            {ARCHITECTURE_CREATED_FINDINGS_FINALIZE_ELIGIBLE_EMPTY}
          </p>
        );
      }

      const activityHref = buildArchitectureWorkspaceTabHref(props.runId, "activity", {
        includeCreateIntent: true,
      });

      return (
        <div
          className="space-y-2"
          data-testid="quick-decision-create-home-in-progress-empty"
        >
          <p className="m-0 text-neutral-600 dark:text-neutral-400">
            {ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_EMPTY}
          </p>
          {props.onNavigateActivity !== undefined ? (
            <button
              type="button"
              className={cn("h-auto border-0 bg-transparent p-0", OPERATOR_LINK.nav)}
              onClick={props.onNavigateActivity}
            >
              {ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK}
            </button>
          ) : (
            <Link href={activityHref} className={OPERATOR_LINK.nav}>
              {ARCHITECTURE_CREATED_FINDINGS_IN_PROGRESS_ACTIVITY_LINK}
            </Link>
          )}
        </div>
      );
    }

    return <p className="m-0 text-neutral-600 dark:text-neutral-400">No findings to act on</p>;
  }

  function renderFindingRow(f: QuickDecisionFinding, showTierBadge: boolean, subdued = false): ReactElement {
    const href = getFindingDetailHref(props.runId, f.findingId);
    const snippet = quickDecisionRecommendationSnippet(f);
    const badgeLabel = severityBadgeLabel(f.severityValue);
    const { evidenceRefCount, viewEvidenceHref } = buildQuickDecisionFindingEvidenceLinks(props.runId, f);
    const citationModel = buildFindingPolicyEvidenceCitationsFromQuickDecision(props.runId, f);
    const reviewStatus = humanReviewStatusDisplay(f.humanReviewStatus);
    const owner = f.assignedToUserId?.trim() ?? "";

    const workspaceCardMode = props.workspaceCardMode === true;

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
              kind={severityKindFromNumericValue(f.severityValue)}
              label={badgeLabel}
              className="shrink-0 tabular-nums"
            />
          ) : null}
          {showTierBadge ? (
            <StatusTag kind="neutral" label={findingEnforcementTierLabel(f.enforcementTier)} className="shrink-0" />
          ) : null}
          {f.confidenceLevel === "High" || f.confidenceLevel === "Medium" || f.confidenceLevel === "Low" ? (
            <FindingConfidenceBadge level={f.confidenceLevel} />
          ) : null}
          <AiOutputGovernanceLabel findingId={f.findingId} />
          <FindingTrustChip finding={f} />
          {findingHasNoSourceEvidence(f) ? (
            <StatusTag
              kind="needs-attention"
              label="Evidence gap"
              data-testid={`finding-evidence-gap-${f.findingId}`}
            />
          ) : null}
          {!workspaceCardMode && reviewStatus !== null ? (
            <StatusTag
              kind={reviewStatus.statusKind}
              label={reviewStatus.label}
              data-testid={`finding-review-status-${f.findingId}`}
            />
          ) : null}
          {f.isMuted ? (
            <StatusTag kind="neutral" label="Muted" className="shrink-0" />
          ) : null}
          {!workspaceCardMode ? (
            <Link
              href={href}
              prefetch={false}
              className={cn(OPERATOR_LINK.nav, "min-w-0 flex-1")}
            >
              <span className="sr-only">Finding {f.findingId}: </span>
              {f.title}
            </Link>
          ) : (
            <span className={cn("min-w-0 flex-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
              {f.title}
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
              setActiveReasoning(f);
              setReasoningOpen(true);
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
              setAskFindingId((current) => (current === f.findingId ? null : f.findingId));
            }}
            aria-pressed={askFindingId === f.findingId}
            title="Ask about this finding"
          >
            <MessageCircle className="mr-1 h-3.5 w-3.5" aria-hidden />
            Ask
          </Button>
          {f.iacStub !== null && f.iacStub !== undefined && f.iacStub.length > 0 ? (
            <StatusTag kind="neutral" label="Bicep stub" className="shrink-0" />
          ) : null}
          {canMutate && !f.isMuted ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={cn("h-8 shrink-0", OPERATOR_TYPOGRAPHY.button)}
              title="Hide this finding from the default list for this review"
              onClick={() => {
                openMuteDialog(f);
              }}
            >
              Mute
            </Button>
          ) : null}
          {canMutate ? (
            <FindingFeedbackThumbs runId={props.runId} findingId={f.findingId} compact />
          ) : null}
        </div>
        {f.traceConfidenceLabel !== null &&
        f.traceConfidenceLabel !== undefined &&
        f.traceConfidenceLabel.trim().length > 0 ? (
          <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Evaluation trace: {f.traceConfidenceLabel}
          </p>
        ) : null}
        {f.evaluationConfidenceScore !== null &&
        f.evaluationConfidenceScore !== undefined &&
        Number.isFinite(f.evaluationConfidenceScore) &&
        (f.confidenceLevel !== "High" &&
          f.confidenceLevel !== "Medium" &&
          f.confidenceLevel !== "Low") ? (
          <p className={cn("m-0 mt-0.5 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Evaluation score {Math.round(f.evaluationConfidenceScore)}
          </p>
        ) : null}
        {snippet.length > 0 && !workspaceCardMode ? (
          <p className={cn("m-0 mt-1 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Recommended action: </span>
            <span>{snippet}</span>
          </p>
        ) : null}
        {owner.length > 0 && !workspaceCardMode ? (
          <p
            className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid={`finding-owner-${f.findingId}`}
          >
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">Owner: </span>
            {owner}
          </p>
        ) : null}
        <FindingPolicyEvidenceCitationLinks model={citationModel} compact className="mt-2" />
        {f.evidenceRefSnippets !== undefined && f.evidenceRefSnippets.length > 0 ? (
          <FindingEvidenceRefSnippets snippets={f.evidenceRefSnippets} />
        ) : null}
        {(f.insightDensityScore !== null && f.insightDensityScore !== undefined) ||
        (f.whyThisIsNotGeneric !== null && f.whyThisIsNotGeneric !== undefined && f.whyThisIsNotGeneric.length > 0) ? (
          <FindingInsightDensityDisclosure
            insightDensityScore={f.insightDensityScore ?? null}
            whyThisIsNotGeneric={f.whyThisIsNotGeneric ?? null}
            className="mt-2"
          />
        ) : null}
        {!workspaceCardMode ? (
          <div
            className="mt-2 border-t border-neutral-100 pt-2 dark:border-neutral-800"
            data-testid={`finding-itsm-sync-${f.findingId}`}
          >
            {props.packageCommitted === false ? null : props.providerNeutralWorkItems === true && props.architectureWorkItemContext ? (
              <FindingCreateWorkItemActions
                runId={props.runId}
                finding={f}
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
                    findingId={f.findingId}
                    findingTitle={f.title}
                    severityLabel={quickDecisionWorkItemSeverityLabel(f.severityValue)}
                    recommendedAction={f.recommendation}
                    statusLabel="Open"
                    compact
                  />
                  <ItsmOutboundQuickActions findingId={f.findingId} compact />
                </div>
              </>
            )}
          </div>
        ) : null}
        {askFindingId === f.findingId ? (
          <div className="mt-3">
            <FindingAskInlinePanel findingId={f.findingId} defaultOpen />
          </div>
        ) : null}
      </>
    );

    return (
      <li
        key={f.findingId}
        className={cn("pl-1", subdued ? "opacity-80" : undefined)}
        data-testid={subdued ? `quick-decision-low-confidence-${f.findingId}` : undefined}
      >
        {rowBody}
      </li>
    );
  }

  function buildWorkspaceVisibleFindings(): QuickDecisionFinding[] {
    const sourceFindings = confidenceManagedExternally ? afterMuteFilter : trustedFindings;
    const rendered = buildWorkspaceCardRenderedFindings(sourceFindings, {
      showAdvisory,
      showMuted: false,
    });

    if (!confidenceManagedExternally && showLowConfidence) {
      return sortQuickDecisionFindings([...rendered, ...lowConfidenceFindings]);
    }

    return rendered;
  }

  const workspaceCardContext: QuickDecisionWorkspaceCardContext = {
    runId: props.runId,
    allFindings: props.findings,
    packageCommitted: props.packageCommitted,
    providerNeutralWorkItems: props.providerNeutralWorkItems,
    architectureWorkItemContext: props.architectureWorkItemContext,
  };

  function openReasoningDialog(finding: QuickDecisionFinding): void {
    setActiveReasoning(finding);
    setReasoningOpen(true);
  }

  function toggleAskPanel(finding: QuickDecisionFinding): void {
    setAskFindingId((current) => (current === finding.findingId ? null : finding.findingId));
  }

  function renderWorkspacePrimaryFinding(f: QuickDecisionFinding): ReactElement {
    return (
      <QuickDecisionWorkspacePrimaryFindingCard
        key={f.findingId}
        context={workspaceCardContext}
        finding={f}
        canMutate={canMutate}
        askPanelOpen={askFindingId === f.findingId}
        onToggleAskPanel={toggleAskPanel}
        onViewReasoning={openReasoningDialog}
        onMute={openMuteDialog}
      />
    );
  }

  function renderWorkspaceSecondaryFinding(f: QuickDecisionFinding, subdued = false): ReactElement {
    return (
      <QuickDecisionWorkspaceSecondaryFindingCard
        key={f.findingId}
        context={workspaceCardContext}
        finding={f}
        subdued={subdued}
      />
    );
  }

  /** Reasoning + mute dialogs shared by both layouts; `muteReasonInputId` keeps label ids unique per layout. */
  function renderDialogs(muteReasonInputId: string): ReactElement {
    return (
      <>
        <FindingAiReasoningDialog
          open={reasoningOpen}
          onOpenChange={(open) => {
            setReasoningOpen(open);

            if (!open) {
              setActiveReasoning(null);
            }
          }}
          findingId={activeReasoning?.findingId ?? null}
          findingTitle={activeReasoning?.title ?? ""}
          snapshot={activeReasoning?.aiReasoning ?? null}
        />
        <QuickDecisionFindingMuteDialog
          runId={props.runId}
          finding={muteTarget}
          open={muteOpen}
          onOpenChange={handleMuteDialogOpenChange}
          reasonInputId={muteReasonInputId}
        />
      </>
    );
  }

  if (props.workspaceCardMode === true) {
    const visibleFindings = buildWorkspaceVisibleFindings();
    const primaryFinding = visibleFindings[0] ?? null;
    const additionalFindings = visibleFindings.slice(1);

    return (
      <>
        <div
          data-testid="quick-decision-summary"
          className={cn("space-y-4 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
        >
          {hasSourceFindings ? (
            <div className="flex flex-wrap items-center gap-3">
              <label className={cn("flex cursor-pointer items-center gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                  checked={showLowConfidence}
                  onChange={(e) => {
                    setShowLowConfidence(e.target.checked);
                  }}
                  data-testid="quick-decision-show-low-confidence"
                />
                Show low-confidence findings
              </label>
              <label className={cn("flex cursor-pointer items-center gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                  checked={showMuted}
                  onChange={(e) => {
                    setShowMuted(e.target.checked);
                  }}
                />
                Show muted findings
              </label>
              {hiddenLowConfidenceHint !== null ? (
                <span className={OPERATOR_TYPOGRAPHY.helper} data-testid="quick-decision-low-confidence-hidden-hint">
                  {hiddenLowConfidenceHint}.
                </span>
              ) : null}
            </div>
          ) : null}
          {props.usingExplanationFallback === true ? (
            <p
              className={cn(
                "m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
                OPERATOR_TYPOGRAPHY.helper,
              )}
              data-testid="quick-decision-explanation-fallback-notice"
              role="status"
            >
              Confidence rows are derived from the aggregate explanation trace because per-finding agent results were not
              on this review payload. Re-run execute or refresh after commit if you need agent-result grounding.
            </p>
          ) : null}
          {!hasSourceFindings ? (
            renderEmptySummary()
          ) : props.findings.length === 0 && confidenceManagedExternally ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">No findings match the current filters.</p>
          ) : afterMuteFilter.length === 0 ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">
              All findings are currently muted. Enable <strong>Show muted findings</strong> to review them.
            </p>
          ) : trustedFindings.length === 0 && lowConfidenceFindings.length > 0 && !showLowConfidence && !confidenceManagedExternally ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400" data-testid="quick-decision-low-confidence-only">
              Low-confidence findings are hidden to reduce noise. Enable <strong>Show low-confidence findings</strong>{" "}
              to review unverified items.
            </p>
          ) : primaryFinding === null ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">No findings match the current filters.</p>
          ) : (
            <div className="space-y-4">
              {renderWorkspacePrimaryFinding(primaryFinding)}
              {advisoryNotes.length > 0 && !showAdvisory ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                  <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {advisoryNotes.length} advisory note{advisoryNotes.length === 1 ? "" : "s"} hidden by default.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowAdvisory(true);
                    }}
                  >
                    Show advisory notes
                  </Button>
                </div>
              ) : null}
              {additionalFindings.length > 0 ? (
                <section aria-labelledby="additional-findings-heading">
                  <h3
                    id="additional-findings-heading"
                    className={cn("m-0 mb-2 font-semibold text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
                  >
                    Additional findings ({additionalFindings.length})
                  </h3>
                  <QuickDecisionAdditionalFindingsList
                    findings={additionalFindings}
                    renderFinding={(finding) => renderWorkspaceSecondaryFinding(finding)}
                  />
                </section>
              ) : null}
            </div>
          )}
          {hasSourceFindings && policyPackSummary.length > 0 ? (
            <details className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800" data-workspace-disclosure>
              <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.body)}>
                Policy pack impact
              </summary>
              <div className="mt-3">
                <ReviewDetailPolicyPackFindingsBreakdown
                  groups={policyPackSummary}
                  manifestRuleSetId={props.manifestRuleSetId}
                  mappedFindingCount={policyPackImpact.mappedFindingCount}
                  unmappedFindingCount={policyPackImpact.unmappedFindingCount}
                />
              </div>
            </details>
          ) : null}
        </div>
        {renderDialogs("finding-mute-reason-workspace")}
      </>
    );
  }

  return (
    <>
      <Card
        data-testid="quick-decision-summary"
        className="rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30"
      >
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}>
                {buyerPolishedShell ? "Decision summary" : "Quick decision summary"}
              </CardTitle>
              {hasSourceFindings ? (
                <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Export CSV or JSON above, or use <strong>Copy for Jira</strong> on each finding for one-click ticket paste.
                  {provenanceAggregateLine !== null ? (
                    <span className="mt-1 block" data-testid="finding-provenance-aggregate">
                      {provenanceAggregateLine}
                    </span>
                  ) : null}
                  {hiddenLowConfidenceHint !== null ? (
                    <span className="mt-1 block" data-testid="quick-decision-low-confidence-hidden-hint">
                      {hiddenLowConfidenceHint}.
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>
            {hasSourceFindings ? (
              <div className="flex flex-wrap items-center gap-3">
                <label className={cn("flex cursor-pointer items-center gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                    checked={showLowConfidence}
                    onChange={(e) => {
                      setShowLowConfidence(e.target.checked);
                    }}
                    data-testid="quick-decision-show-low-confidence"
                  />
                  Show low-confidence findings
                </label>
                <label className={cn("flex cursor-pointer items-center gap-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600"
                    checked={showMuted}
                    onChange={(e) => {
                      setShowMuted(e.target.checked);
                    }}
                  />
                  Show muted findings
                </label>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className={cn("space-y-3 pt-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {hasSourceFindings ? (
            <FindingsItsmExportToolbar runId={props.runId} findings={props.findings} />
          ) : null}
          {hasSourceFindings && policyPackSummary.length > 0 ? (
            <ReviewDetailPolicyPackFindingsBreakdown
              groups={policyPackSummary}
              manifestRuleSetId={props.manifestRuleSetId}
              mappedFindingCount={policyPackImpact.mappedFindingCount}
              unmappedFindingCount={policyPackImpact.unmappedFindingCount}
            />
          ) : null}
          {props.usingExplanationFallback === true ? (
            <p
              className={cn(
                "m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
                OPERATOR_TYPOGRAPHY.helper,
              )}
              data-testid="quick-decision-explanation-fallback-notice"
              role="status"
            >
              Confidence rows are derived from the aggregate explanation trace because per-finding agent results were not
              on this review payload. Re-run execute or refresh after commit if you need agent-result grounding.
            </p>
          ) : null}
          {!hasSourceFindings ? (
            renderEmptySummary()
          ) : props.findings.length === 0 && confidenceManagedExternally ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">No findings match the current filters.</p>
          ) : afterMuteFilter.length === 0 ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400">
              All findings are currently muted. Enable <strong>Show muted findings</strong> to review them.
            </p>
          ) : trustedFindings.length === 0 && lowConfidenceFindings.length > 0 && !showLowConfidence && !confidenceManagedExternally ? (
            <p className="m-0 text-neutral-600 dark:text-neutral-400" data-testid="quick-decision-low-confidence-only">
              Low-confidence findings are hidden to reduce noise. Enable <strong>Show low-confidence findings</strong>{" "}
              to review unverified items.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className={cn("m-0 mb-2", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
                  Policy violations
                </h3>
                {policyViolations.length === 0 ? (
                  <p className="m-0 text-neutral-600 dark:text-neutral-400">
                    No governance-blocking findings on this review. Baseline guidance may still appear under advisory notes.
                  </p>
                ) : (
                  <div className="space-y-4" data-testid="quick-decision-policy-violations">
                    {topGroups.map((group) => (
                      <div key={group.groupKey}>
                        <h4 className={cn("m-0 mb-2 font-semibold text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                          {group.packDisplayName}
                          <span className="ml-1 font-normal text-neutral-500 dark:text-neutral-400">
                            ({group.findingCount})
                          </span>
                        </h4>
                        <ol className="m-0 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                          {group.findings.slice(0, 3).map((f) => renderFindingRow(f, false))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {advisoryNotes.length > 0 ? (
                <div
                  className="rounded-md border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-700 dark:bg-neutral-900/30"
                  data-testid="quick-decision-advisory-notes"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
                        Advisory notes
                      </h3>
                      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                        Opt-in baseline guidance from enabled policy packs. These do not block commit.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAdvisory(!showAdvisory);
                      }}
                      aria-expanded={showAdvisory}
                    >
                      {showAdvisory ? "Hide advisory notes" : `Show ${advisoryNotes.length} advisory note${advisoryNotes.length === 1 ? "" : "s"}`}
                    </Button>
                  </div>
                  {showAdvisory ? (
                    <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                      {advisoryNotes.map((f) => renderFindingRow(f, true))}
                    </ol>
                  ) : null}
                </div>
              ) : null}

              {showLowConfidence && lowConfidenceFindings.length > 0 ? (
                <div
                  className="rounded-md border border-dashed border-neutral-300 bg-neutral-50/50 p-3 dark:border-neutral-600 dark:bg-neutral-900/20"
                  data-testid="quick-decision-low-confidence-section"
                >
                  <h3 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL, "text-neutral-700 dark:text-neutral-300")}>
                    Unverified / low confidence
                  </h3>
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    These findings had low evaluation confidence or ambiguous evidence. Verify before acting.
                  </p>
                  {lowConfidencePolicyViolations.length > 0 ? (
                    <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                      {lowConfidencePolicyViolations.map((f) => renderFindingRow(f, false, true))}
                    </ol>
                  ) : null}
                  {lowConfidenceAdvisoryNotes.length > 0 ? (
                    <ol className="m-0 mt-3 list-decimal space-y-3 pl-5 marker:text-neutral-500 dark:marker:text-neutral-400">
                      {lowConfidenceAdvisoryNotes.map((f) => renderFindingRow(f, true, true))}
                    </ol>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {renderDialogs("finding-mute-reason")}
    </>
  );
}
