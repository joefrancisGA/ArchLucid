"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { FindingDerivationLine } from "@/components/usability/FindingDerivationLine";
import { SponsorPlainEnglishFindingPanel } from "@/components/findings/SponsorPlainEnglishFindingPanel";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOptionallyControlledBoolean } from "@/hooks/use-optionally-controlled-boolean";
import { usePrefetchItsmFindingCorrelations } from "@/lib/use-itsm-finding-correlations";
import { postFindingMute } from "@/lib/api";
import { getFindingEvidenceTraceHref } from "@/lib/finding-evidence-navigation";
import { findingDerivationFromQuickDecisionFinding } from "@/lib/finding-derivation-sentence";
import { graphTrailHrefWithOptionalNode } from "@/lib/graph-finding-deep-links";
import { preferredGraphNodeIdForFindingDeepLink } from "@/lib/finding-inspect-graph-evidence";
import {
  defaultManifestIdForShowcaseFinding,
  primaryFindingEvidenceNavigationHref,
  runDetailSectionHref,
} from "@/lib/finding-source-evidence-links";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import {
  buildWorkspaceCardRenderedFindings,
  findingHasNoSourceEvidence,
  firstRecommendationSentence,
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
  FINDINGS_ROW_METADATA_TAG_SIZE,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { resolveFindingActivityAtUtc } from "@/lib/finding-activity-at-utc";
import { NewSinceLastVisitMarker } from "@/components/usability/NewSinceLastVisitMarker";
import {
  isActivityNewSinceLastVisit,
  markLastVisitedNow,
  reviewFindingWatermarkKey,
} from "@/lib/usability/last-visited-watermark";

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
  readonly architectureWorkItemContext?: {
    readonly architectureName: string;
    readonly architectureOverview: string;
    readonly ownerLabel: string | null;
  } | null;
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
  const router = useRouter();
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
  const [openWorkspaceIntegrationsByFindingId, setOpenWorkspaceIntegrationsByFindingId] = useState<
    Readonly<Record<string, boolean>>
  >({});
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
  const [muteReason, setMuteReason] = useState("");
  const [muteBusy, setMuteBusy] = useState(false);
  const [muteError, setMuteError] = useState<string | null>(null);
  const [askFindingId, setAskFindingId] = useState<string | null>(null);

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
    const href = `/architecture/reviews/${encodeURIComponent(props.runId)}/findings/${encodeURIComponent(f.findingId)}`;
    const snippet =
      f.recommendation.length > 0
        ? firstRecommendationSentence(f.recommendation)
        : "See finding detail for recommended actions.";
    const badgeLabel = severityBadgeLabel(f.severityValue);
    const graphFocusId = preferredGraphNodeIdForFindingDeepLink(props.runId, f.findingId);
    const evidenceRefCount = f.evidenceRefCount ?? 0;
    const manifestId = defaultManifestIdForShowcaseFinding(props.runId, f.findingId);
    const manifestHref =
      manifestId !== null ? runDetailSectionHref(props.runId, "manifest-summary") : null;
    const graphHref =
      evidenceRefCount > 0 || graphFocusId !== null
        ? graphTrailHrefWithOptionalNode(props.runId, graphFocusId)
        : null;
    const viewEvidenceHref =
      primaryFindingEvidenceNavigationHref(
        manifestHref !== null
          ? [{ kind: "manifestSection", label: "Manifest", detail: null, href: manifestHref }]
          : graphHref !== null
            ? [{ kind: "graphNode", label: "Graph", detail: null, href: graphHref }]
            : [],
      ) ?? graphHref;
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
                setMuteTarget(f);
                setMuteReason("");
                setMuteError(null);
                setMuteOpen(true);
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
                    severityLabel={
                      f.severityValue >= 3 ? "High" : f.severityValue === 2 ? "Medium" : f.severityValue === 1 ? "Low" : "Info"
                    }
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

  function renderWorkspaceIntegrations(f: QuickDecisionFinding): ReactElement | null {
    if (props.packageCommitted === false) {
      return null;
    }

    return (
      <details
        className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800"
        data-workspace-disclosure
        onToggle={(event) => {
          const open = event.currentTarget.open;
          setOpenWorkspaceIntegrationsByFindingId((current) => ({
            ...current,
            [f.findingId]: open,
          }));
        }}
      >
        <summary className={cn("cursor-pointer font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          Create work item / Integrations
        </summary>
        <div className="mt-2" data-testid={`finding-itsm-sync-${f.findingId}`}>
          {props.providerNeutralWorkItems === true && props.architectureWorkItemContext ? (
            <FindingCreateWorkItemActions
              runId={props.runId}
              finding={f}
              architectureName={props.architectureWorkItemContext.architectureName}
              architectureOverview={props.architectureWorkItemContext.architectureOverview}
              ownerLabel={props.architectureWorkItemContext.ownerLabel}
              allFindings={props.findings}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <CopyGovernanceQueueWorkItemButton
                runId={props.runId}
                findingId={f.findingId}
                findingTitle={f.title}
                severityLabel={
                  f.severityValue >= 3 ? "High" : f.severityValue === 2 ? "Medium" : f.severityValue === 1 ? "Low" : "Info"
                }
                recommendedAction={f.recommendation}
                statusLabel="Open"
                compact
              />
              <ItsmOutboundQuickActions
                findingId={f.findingId}
                compact
                loadWhen={openWorkspaceIntegrationsByFindingId[f.findingId] === true}
              />
            </div>
          )}
        </div>
      </details>
    );
  }

  function renderWorkspaceSupportingDetails(f: QuickDecisionFinding): ReactElement {
    const citationModel = buildFindingPolicyEvidenceCitationsFromQuickDecision(props.runId, f);

    return (
      <details
        className="mt-4 rounded-md border border-neutral-200 bg-neutral-50/50 p-3 dark:border-neutral-800 dark:bg-neutral-900/30"
        data-workspace-disclosure
        data-testid={`finding-workspace-supporting-${f.findingId}`}
      >
        <summary className={cn("cursor-pointer font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
          Supporting detail
        </summary>
        <div className="mt-3 space-y-3">
          {citationModel.pack !== null || citationModel.policy !== null ? (
            <FindingPolicyCitationProminentStrip
              pack={citationModel.pack}
              policy={citationModel.policy}
              compact
            />
          ) : null}
          <FindingPolicyEvidenceCitationLinks model={citationModel} />
          {f.evidenceRefSnippets !== undefined && f.evidenceRefSnippets.length > 0 ? (
            <FindingEvidenceRefSnippets snippets={f.evidenceRefSnippets} />
          ) : null}
          {(f.insightDensityScore !== null && f.insightDensityScore !== undefined) ||
          (f.whyThisIsNotGeneric !== null &&
            f.whyThisIsNotGeneric !== undefined &&
            f.whyThisIsNotGeneric.length > 0) ? (
            <FindingInsightDensityDisclosure
              insightDensityScore={f.insightDensityScore ?? null}
              whyThisIsNotGeneric={f.whyThisIsNotGeneric ?? null}
            />
          ) : null}
          {renderWorkspaceIntegrations(f)}
          {f.traceConfidenceLabel !== null &&
          f.traceConfidenceLabel !== undefined &&
          f.traceConfidenceLabel.trim().length > 0 ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Evaluation trace: {f.traceConfidenceLabel}
            </p>
          ) : null}
        </div>
      </details>
    );
  }

  function renderWorkspacePrimaryFinding(f: QuickDecisionFinding): ReactElement {
    const href = `/architecture/reviews/${encodeURIComponent(props.runId)}/findings/${encodeURIComponent(f.findingId)}`;
    const snippet =
      f.recommendation.length > 0
        ? firstRecommendationSentence(f.recommendation)
        : "See finding detail for recommended actions.";
    const badgeLabel = severityBadgeLabel(f.severityValue);
    const graphFocusId = preferredGraphNodeIdForFindingDeepLink(props.runId, f.findingId);
    const evidenceRefCount = f.evidenceRefCount ?? 0;
    const manifestId = defaultManifestIdForShowcaseFinding(props.runId, f.findingId);
    const manifestHref =
      manifestId !== null ? runDetailSectionHref(props.runId, "manifest-summary") : null;
    const graphHref =
      evidenceRefCount > 0 || graphFocusId !== null
        ? graphTrailHrefWithOptionalNode(props.runId, graphFocusId)
        : null;
    const viewEvidenceHref =
      primaryFindingEvidenceNavigationHref(
        manifestHref !== null
          ? [{ kind: "manifestSection", label: "Manifest", detail: null, href: manifestHref }]
          : graphHref !== null
            ? [{ kind: "graphNode", label: "Graph", detail: null, href: graphHref }]
            : [],
      ) ?? graphHref;
    const reviewStatus = humanReviewStatusDisplay(f.humanReviewStatus);
    const owner = f.assignedToUserId?.trim() ?? "";
    const findingActivityAt = resolveFindingActivityAtUtc(f.aiReasoning);
    const findingWatermarkKey = reviewFindingWatermarkKey(props.runId, f.findingId);
    const showNewSinceLastVisit = isActivityNewSinceLastVisit(findingWatermarkKey, findingActivityAt);
    const derivation = findingDerivationFromQuickDecisionFinding(f);
    const evidenceTraceHref = getFindingEvidenceTraceHref(props.runId, f.findingId);

    return (
      <article
        key={f.findingId}
        className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
        data-testid={`finding-workspace-card-${f.findingId}`}
        data-finding-workspace-primary="true"
        data-finding-id={f.findingId}
        tabIndex={0}
      >
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {showNewSinceLastVisit ? <NewSinceLastVisitMarker testId={`finding-new-${f.findingId}`} /> : null}
            <SeverityTag
              severity={badgeLabel}
              kind={severityKindFromNumericValue(f.severityValue)}
              label={badgeLabel}
              className={cn("shrink-0 tabular-nums", FINDINGS_ROW_METADATA_TAG_SIZE)}
            />
            {reviewStatus !== null ? (
              <StatusTag
                kind={reviewStatus.statusKind}
                label={reviewStatus.label}
                className={FINDINGS_ROW_METADATA_TAG_SIZE}
                data-testid={`finding-review-status-${f.findingId}`}
              />
            ) : (
              <StatusTag kind="neutral" label="Open" className={FINDINGS_ROW_METADATA_TAG_SIZE} />
            )}
            <StatusTag
              kind="neutral"
              label={findingEnforcementTierLabel(f.enforcementTier)}
              className={cn("shrink-0", FINDINGS_ROW_METADATA_TAG_SIZE)}
            />
          </div>
          <h3 className={cn("m-0 text-xl font-bold tracking-tight text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {f.title}
          </h3>
          <FindingDerivationLine
            derivation={derivation}
            evidenceHref={evidenceTraceHref}
            testId={`finding-derivation-${f.findingId}`}
          />
          <SponsorPlainEnglishFindingPanel
            input={{
              title: f.title,
              message: f.recommendation,
              severity: badgeLabel,
              derivationSentence: derivation.sentence,
              residualRisk: null,
            }}
            testId={`sponsor-plain-english-${f.findingId}`}
          />
          {snippet.length > 0 ? (
            <p className={cn("m-0 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              {snippet}
            </p>
          ) : null}
        </header>
        <dl className={cn("m-0 mt-4 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}>
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Owner</dt>
            <dd className="m-0 mt-0.5 font-medium text-neutral-800 dark:text-neutral-200" data-testid={`finding-owner-${f.findingId}`}>
              {owner.length > 0 ? owner : "No remediation owner assigned"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Confidence</dt>
            <dd className="m-0 mt-0.5">
              {f.confidenceLevel === "High" || f.confidenceLevel === "Medium" || f.confidenceLevel === "Low" ? (
                <FindingConfidenceBadge level={f.confidenceLevel} />
              ) : (
                <span className="font-medium text-neutral-800 dark:text-neutral-200">Not scored</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Evidence</dt>
            <dd className="m-0 mt-0.5 font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
              {evidenceRefCount} reference{evidenceRefCount === 1 ? "" : "s"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500 dark:text-neutral-400">Decision state</dt>
            <dd className="m-0 mt-0.5 font-medium text-neutral-800 dark:text-neutral-200">
              {reviewStatus?.label ?? "Not recorded"}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="default" className="h-8" asChild>
            <Link
              href={href}
              prefetch={false}
              onClick={() => {
                markLastVisitedNow(findingWatermarkKey, findingActivityAt);
              }}
            >
              Open finding
            </Link>
          </Button>
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
          {canMutate && !f.isMuted ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className={cn("h-8 shrink-0", OPERATOR_TYPOGRAPHY.button)}
              onClick={() => {
                setMuteTarget(f);
                setMuteReason("");
                setMuteError(null);
                setMuteOpen(true);
              }}
            >
              Mute
            </Button>
          ) : null}
        </div>
        {askFindingId === f.findingId ? (
          <div className="mt-3">
            <FindingAskInlinePanel findingId={f.findingId} defaultOpen />
          </div>
        ) : null}
        {renderWorkspaceSupportingDetails(f)}
      </article>
    );
  }

  function renderWorkspaceSecondaryFinding(f: QuickDecisionFinding, subdued = false): ReactElement {
    const href = `/architecture/reviews/${encodeURIComponent(props.runId)}/findings/${encodeURIComponent(f.findingId)}`;
    const badgeLabel = severityBadgeLabel(f.severityValue);
    const reviewStatus = humanReviewStatusDisplay(f.humanReviewStatus);
    const snippet =
      f.recommendation.length > 0
        ? firstRecommendationSentence(f.recommendation)
        : "See finding detail for recommended actions.";
    const derivation = findingDerivationFromQuickDecisionFinding(f);
    const evidenceTraceHref = getFindingEvidenceTraceHref(props.runId, f.findingId);

    return (
      <li
        key={f.findingId}
        className={cn("list-none pl-0", subdued ? "opacity-80" : undefined)}
        data-testid={`finding-workspace-card-${f.findingId}`}
      >
        <details
          className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950"
          data-workspace-disclosure
        >
          <summary
            className={cn(
              "cursor-pointer list-none [&::-webkit-details-marker]:hidden",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <SeverityTag
                severity={badgeLabel}
                kind={severityKindFromNumericValue(f.severityValue)}
                label={badgeLabel}
                className={cn("shrink-0 tabular-nums", FINDINGS_ROW_METADATA_TAG_SIZE)}
              />
              {reviewStatus !== null ? (
                <StatusTag
                  kind={reviewStatus.statusKind}
                  label={reviewStatus.label}
                  className={FINDINGS_ROW_METADATA_TAG_SIZE}
                />
              ) : (
                <StatusTag kind="neutral" label="Open" className={FINDINGS_ROW_METADATA_TAG_SIZE} />
              )}
              <span className="min-w-0 flex-1 font-semibold text-al-text-primary">{f.title}</span>
            </div>
          </summary>
          <div className="mt-3 space-y-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
            <FindingDerivationLine
              derivation={derivation}
              evidenceHref={evidenceTraceHref}
              testId={`finding-derivation-${f.findingId}`}
            />
            <SponsorPlainEnglishFindingPanel
              input={{
                title: f.title,
                message: f.recommendation,
                severity: badgeLabel,
                derivationSentence: derivation.sentence,
                residualRisk: null,
              }}
              testId={`sponsor-plain-english-${f.findingId}`}
            />
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{snippet}</p>
            <Button type="button" size="sm" variant="outline" className="h-8" asChild>
              <Link href={href} prefetch={false}>Open finding</Link>
            </Button>
            {renderWorkspaceSupportingDetails(f)}
          </div>
        </details>
      </li>
    );
  }

  function renderWorkspaceDialogs(): ReactElement {
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
        <Dialog
          open={muteOpen}
          onOpenChange={(open) => {
            setMuteOpen(open);

            if (!open) {
              setMuteTarget(null);
              setMuteReason("");
              setMuteError(null);
              setMuteBusy(false);
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Mute finding</DialogTitle>
              <DialogDescription>
                Provide a short reason. Muted findings are hidden from this summary until you enable{" "}
                <strong>Show muted findings</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="finding-mute-reason-workspace">Reason</Label>
              <Textarea
                id="finding-mute-reason-workspace"
                value={muteReason}
                onChange={(e) => {
                  setMuteReason(e.target.value);
                }}
                rows={4}
                className="resize-y"
                disabled={muteBusy}
              />
              {muteError ? <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)}>{muteError}</p> : null}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMuteOpen(false);
                }}
                disabled={muteBusy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={muteBusy || muteReason.trim().length === 0}
                onClick={() => {
                  if (muteTarget === null) {
                    return;
                  }

                  void (async () => {
                    setMuteBusy(true);
                    setMuteError(null);

                    try {
                      await postFindingMute(props.runId, muteTarget.findingId, muteReason.trim());
                      setMuteOpen(false);
                      router.refresh();
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : "Mute request failed.";
                      setMuteError(msg);
                    } finally {
                      setMuteBusy(false);
                    }
                  })();
                }}
              >
                {muteBusy ? "Saving…" : "Mute finding"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
        {renderWorkspaceDialogs()}
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

      <Dialog
        open={muteOpen}
        onOpenChange={(open) => {
          setMuteOpen(open);

          if (!open) {
            setMuteTarget(null);
            setMuteReason("");
            setMuteError(null);
            setMuteBusy(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mute finding</DialogTitle>
            <DialogDescription>
              Provide a short reason. Muted findings are hidden from this summary until you enable{" "}
              <strong>Show muted findings</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="finding-mute-reason">Reason</Label>
            <Textarea
              id="finding-mute-reason"
              value={muteReason}
              onChange={(e) => {
                setMuteReason(e.target.value);
              }}
              rows={4}
              className="resize-y"
              disabled={muteBusy}
            />
            {muteError ? <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.body)}>{muteError}</p> : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMuteOpen(false);
              }}
              disabled={muteBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={muteBusy || muteReason.trim().length === 0}
              onClick={() => {
                if (muteTarget === null) {
                  return;
                }

                void (async () => {
                  setMuteBusy(true);
                  setMuteError(null);

                  try {
                    await postFindingMute(props.runId, muteTarget.findingId, muteReason.trim());
                    setMuteOpen(false);
                    router.refresh();
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Mute request failed.";
                    setMuteError(msg);
                  } finally {
                    setMuteBusy(false);
                  }
                })();
              }}
            >
              {muteBusy ? "Saving…" : "Mute finding"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
