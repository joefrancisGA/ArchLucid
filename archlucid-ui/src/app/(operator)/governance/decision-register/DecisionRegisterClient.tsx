"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DecisionRegisterTimeline } from "@/components/DecisionRegisterTimeline";
import { DecisionRegisterEmptyTeaching } from "@/components/DecisionRegisterEmptyTeaching";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useArchitectureDecisionRegisterQuery } from "@/hooks/use-architecture-decision-register-query";
import type {
  ArchitectureDecisionRegisterEntry,
  ArchitectureDecisionRegisterFilters,
} from "@/lib/api/governance-stickiness-api";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { BUYER_GOVERNANCE_DECISION_REGISTER_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { DecisionRegisterBreadcrumb } from "./_sections/DecisionRegisterBreadcrumb";
import { DecisionRegisterBuyerChrome } from "./_sections/DecisionRegisterBuyerChrome";
import { DecisionRegisterLoadFailure } from "./_sections/DecisionRegisterLoadFailure";
import { DecisionRegisterLoadingSkeleton } from "./_sections/DecisionRegisterLoadingSkeleton";

import { DecisionRegisterDecisionCard } from "./DecisionRegisterDecisionCard";
import { DecisionRegisterContinueLastViewedRow } from "./DecisionRegisterContinueLastViewedRow";
import { DecisionRegisterViewEmptyShell } from "./DecisionRegisterViewEmptyShell";
import { DecisionRegisterFiltersPanel } from "./DecisionRegisterFiltersPanel";
import { DecisionRegisterSummaryRow } from "./DecisionRegisterSummaryRow";
import { DecisionRegisterViewSwitcher, type DecisionRegisterViewMode } from "./DecisionRegisterViewSwitcher";
import { DecisionRegisterWorkspaceActiveApprovalStrip } from "./DecisionRegisterWorkspaceActiveApprovalStrip";
import { DecisionRegisterPickReviewBeforeFilteringStrip } from "./DecisionRegisterPickReviewBeforeFilteringStrip";
import { DecisionRegisterNextReviewFooterClient } from "./DecisionRegisterNextReviewFooterClient";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  resolveDecisionRegisterFilterEmphasizedStepId,
  resolveDecisionRegisterFilterSteps,
} from "@/lib/decision-register-filter-checklist";
import {
  DECISION_REGISTER_EMPTY_ACTION_GOVERNANCE,
  DECISION_REGISTER_EMPTY_ACTION_REVIEW_PACKAGES,
  DECISION_REGISTER_EMPTY_ACTION_START_REVIEW,
  DECISION_REGISTER_EMPTY_BODY,
  DECISION_REGISTER_EMPTY_TITLE,
  DECISION_REGISTER_FILTER_NO_MATCH_BODY,
  DECISION_REGISTER_FILTER_NO_MATCH_TITLE,
  decisionRegisterPageSubtitle,
  DECISION_REGISTER_VIEW_CARDS_PANEL_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_PANEL_LABEL,
} from "./decision-register-copy";
import {
  DEFAULT_DECISION_REGISTER_DATE_PRESET,
  resolveDecisionRegisterDateRange,
  type DecisionRegisterDatePreset,
} from "./decision-register-date-range";
import { deriveDecisionRegisterSummary } from "./decision-register-summary";
import { resolveContinueLastDecisionRegisterEntry } from "@/lib/resolve-continue-last-decision-register-entry";

const defaultDateRange = resolveDecisionRegisterDateRange(DEFAULT_DECISION_REGISTER_DATE_PRESET);

function matchesDecisionRegisterRunScope(
  decision: ArchitectureDecisionRegisterEntry,
  scopedRunId: string | null,
): boolean {
  if (scopedRunId === null || scopedRunId.trim().length === 0) {
    return true;
  }

  return decision.runId.trim() === scopedRunId.trim();
}

export default function DecisionRegisterClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const projectId = useMemo(
    () => projectIdFromScopeHeaders(getEffectiveBrowserProxyScopeHeaders()),
    [],
  );
  const [category, setCategory] = useState("");
  const [recordedAfter, setRecordedAfter] = useState(defaultDateRange.recordedAfter);
  const [recordedBefore, setRecordedBefore] = useState(defaultDateRange.recordedBefore);
  const [datePreset, setDatePreset] = useState<DecisionRegisterDatePreset>(DEFAULT_DECISION_REGISTER_DATE_PRESET);
  const [minConfidence, setMinConfidence] = useState("");
  const [maxConfidence, setMaxConfidence] = useState("");
  const [confidenceBasis, setConfidenceBasis] = useState("");
  const [viewMode, setViewMode] = useState<DecisionRegisterViewMode>("cards");
  const [reloadToken, setReloadToken] = useState(0);

  const retryLoad = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const filters = useMemo((): ArchitectureDecisionRegisterFilters => {
    const parsed: ArchitectureDecisionRegisterFilters = {};

    if (category.trim().length > 0) {
      parsed.category = category.trim();
    }

    if (recordedAfter.trim().length > 0) {
      parsed.recordedAfterUtc = new Date(recordedAfter).toISOString();
    }

    if (recordedBefore.trim().length > 0) {
      parsed.recordedBeforeUtc = new Date(recordedBefore).toISOString();
    }

    if (minConfidence.trim().length > 0) {
      parsed.minConfidence = Number(minConfidence);
    }

    if (maxConfidence.trim().length > 0) {
      parsed.maxConfidence = Number(maxConfidence);
    }

    if (confidenceBasis.trim().length > 0) {
      parsed.buyerConfidenceSource = confidenceBasis.trim();
    }

    return parsed;
  }, [category, confidenceBasis, maxConfidence, minConfidence, recordedAfter, recordedBefore]);

  const workspaceQuery = useArchitectureDecisionRegisterQuery(projectId);
  const filteredQuery = useArchitectureDecisionRegisterQuery(projectId, filters);

  useEffect(() => {
    if (reloadToken === 0) {
      return;
    }

    void workspaceQuery.refetch();
    void filteredQuery.refetch();
  }, [filteredQuery, reloadToken, workspaceQuery]);

  const workspaceDecisions = useMemo(
    () => [...(workspaceQuery.data?.decisions ?? [])] as ArchitectureDecisionRegisterEntry[],
    [workspaceQuery.data?.decisions],
  );
  const scopedWorkspaceDecisions = useMemo(
    () => workspaceDecisions.filter((decision) => matchesDecisionRegisterRunScope(decision, scopedRunId)),
    [scopedRunId, workspaceDecisions],
  );
  const filteredDecisions = useMemo((): ArchitectureDecisionRegisterEntry[] => {
    const decisions = [...(filteredQuery.data?.decisions ?? [])] as ArchitectureDecisionRegisterEntry[];

    return decisions.filter((decision) => matchesDecisionRegisterRunScope(decision, scopedRunId));
  }, [filteredQuery.data?.decisions, scopedRunId]);
  const loadError = workspaceQuery.isError
    ? (workspaceQuery.error instanceof Error ? workspaceQuery.error.message : "Failed to load decision register.")
    : filteredQuery.isError
      ? (filteredQuery.error instanceof Error ? filteredQuery.error.message : "Failed to load decision register.")
      : null;
  const loadingWorkspace = workspaceQuery.isPending;
  const loadingFiltered = filteredQuery.isPending;

  const summary = useMemo(
    () => deriveDecisionRegisterSummary(scopedWorkspaceDecisions),
    [scopedWorkspaceDecisions],
  );
  const continueLastDecision = useMemo(
    () => resolveContinueLastDecisionRegisterEntry(scopedWorkspaceDecisions),
    [scopedWorkspaceDecisions],
  );
  const collapseAdvancedFilters = scopedWorkspaceDecisions.length === 0;
  const loading = loadingWorkspace || loadingFiltered;
  const hasWorkspaceDecisions = scopedWorkspaceDecisions.length > 0;
  const hasFilteredResults = filteredDecisions.length > 0;
  const filtersExcludeMatches = hasWorkspaceDecisions && !hasFilteredResults && !loading && loadError === null;
  const filtersConfigured =
    category.trim().length > 0 ||
    minConfidence.trim().length > 0 ||
    maxConfidence.trim().length > 0 ||
    confidenceBasis.trim().length > 0 ||
    datePreset !== DEFAULT_DECISION_REGISTER_DATE_PRESET;
  const decisionRegisterFilterChecklistSteps = resolveDecisionRegisterFilterSteps({
    reviewPicked: scopedRunFilterActive,
    filtersConfigured,
    registerReviewed: scopedRunFilterActive && hasFilteredResults && !loading,
  });
  const decisionRegisterFilterChecklistEmphasizedStepId = resolveDecisionRegisterFilterEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    filtersConfigured,
    registerReviewed: scopedRunFilterActive && hasFilteredResults && !loading,
  });

  const onPickReviewForFiltering = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${GOVERNANCE_DECISION_REGISTER_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const resetFilters = useCallback(() => {
    const range = resolveDecisionRegisterDateRange(DEFAULT_DECISION_REGISTER_DATE_PRESET);
    setCategory("");
    setRecordedAfter(range.recordedAfter);
    setRecordedBefore(range.recordedBefore);
    setDatePreset(DEFAULT_DECISION_REGISTER_DATE_PRESET);
    setMinConfidence("");
    setMaxConfidence("");
    setConfidenceBasis("");
  }, []);

  const applyDatePreset = useCallback((preset: DecisionRegisterDatePreset) => {
    const range = resolveDecisionRegisterDateRange(preset);
    setDatePreset(preset);
    setRecordedAfter(range.recordedAfter);
    setRecordedBefore(range.recordedBefore);
  }, []);

  return (
    <div className="space-y-4 p-4" data-testid="decision-register-page">
      <OperatorPageHeader
        navHref={GOVERNANCE_DECISION_REGISTER_PATH}
        title={BUYER_GOVERNANCE_DECISION_REGISTER_TITLE}
        subtitle={decisionRegisterPageSubtitle(buyerPolishedShell)}
        breadcrumb={<DecisionRegisterBreadcrumb />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            <DecisionRegisterViewSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
          </div>
        }
      />
      <DecisionRegisterBuyerChrome />
      <GovernanceJobRouterStrip currentJobId="record-decisions" />
      {buyerPolishedShell ? null : (
        <DecisionRegisterFindingsVocabularyRail currentSurfaceId="decision-register" />
      )}
      {!loadError ? <DecisionRegisterSummaryRow summary={summary} /> : null}

      {scopedRunFilterActive ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="decision-register-run-scope-banner"
        >
          {"Showing decisions for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={GOVERNANCE_DECISION_REGISTER_PATH}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_LINK.inline}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : (
        <DecisionRegisterPickReviewBeforeFilteringStrip
          selectedReviewId=""
          onSelectReview={onPickReviewForFiltering}
        />
      )}

      {scopedRunFilterActive ? (
        <IntegrationConnectChecklist
          title="Filter checklist"
          steps={decisionRegisterFilterChecklistSteps}
          emphasizedStepId={decisionRegisterFilterChecklistEmphasizedStepId}
          testIdPrefix="decision-register-filter"
        />
      ) : null}

      {scopedRunFilterActive ? (
        <DecisionRegisterFiltersPanel
          category={category}
          recordedAfter={recordedAfter}
          recordedBefore={recordedBefore}
          minConfidence={minConfidence}
          maxConfidence={maxConfidence}
          confidenceBasis={confidenceBasis}
          datePreset={datePreset}
          collapseAdvanced={collapseAdvancedFilters}
          onCategoryChange={setCategory}
          onRecordedAfterChange={(value) => {
            setRecordedAfter(value);
            setDatePreset("all");
          }}
          onRecordedBeforeChange={(value) => {
            setRecordedBefore(value);
            setDatePreset("all");
          }}
          onMinConfidenceChange={setMinConfidence}
          onMaxConfidenceChange={setMaxConfidence}
          onConfidenceBasisChange={setConfidenceBasis}
          onDatePresetChange={applyDatePreset}
          onClearFilters={resetFilters}
        />
      ) : null}

      {!loading && !loadError && continueLastDecision !== null ? (
        <DecisionRegisterContinueLastViewedRow decision={continueLastDecision} />
      ) : null}

      {loading ? <DecisionRegisterLoadingSkeleton /> : null}

      {loadError && buyerPolishedShell ? (
        <DecisionRegisterLoadFailure message={loadError} onRetry={retryLoad} />
      ) : null}

      {loadError && !buyerPolishedShell ? (
        <EnterpriseCompactEmptyState
          testId="decision-register-load-error"
          title="Decision register unavailable"
          description={loadError}
          actions={[{ label: DECISION_REGISTER_EMPTY_ACTION_REVIEW_PACKAGES, href: "/architecture/reviews", variant: "primary" }]}
        />
      ) : null}

      {!loading && !loadError && !hasWorkspaceDecisions ? (
        <DecisionRegisterViewEmptyShell viewMode={viewMode}>
          <div className="space-y-3">
            <DecisionRegisterWorkspaceActiveApprovalStrip />
            {buyerPolishedShell ? null : <DecisionRegisterEmptyTeaching />}
            <EnterpriseCompactEmptyState
              testId="decision-register-empty-state"
              title={DECISION_REGISTER_EMPTY_TITLE}
              description={DECISION_REGISTER_EMPTY_BODY}
              actions={[
                { label: DECISION_REGISTER_EMPTY_ACTION_REVIEW_PACKAGES, href: "/architecture/reviews", variant: "primary" },
                { label: DECISION_REGISTER_EMPTY_ACTION_START_REVIEW, href: "/architecture/reviews/new", variant: "outline" },
                { label: DECISION_REGISTER_EMPTY_ACTION_GOVERNANCE, href: "/governance/approval-queue", variant: "outline" },
              ]}
            />
          </div>
        </DecisionRegisterViewEmptyShell>
      ) : null}

      {!loading && !loadError && filtersExcludeMatches ? (
        <DecisionRegisterViewEmptyShell viewMode={viewMode}>
          <EnterpriseCompactEmptyState
            testId="decision-register-filter-no-match-empty-state"
            title={DECISION_REGISTER_FILTER_NO_MATCH_TITLE}
            description={DECISION_REGISTER_FILTER_NO_MATCH_BODY}
            footer={
              <Button type="button" variant="outline" size="sm" data-testid="decision-register-clear-filters-empty" onClick={resetFilters}>
                Clear filters
              </Button>
            }
          />
        </DecisionRegisterViewEmptyShell>
      ) : null}

      {!loading && !loadError && hasFilteredResults && viewMode === "timeline" ? (
        <div aria-label={DECISION_REGISTER_VIEW_TIMELINE_PANEL_LABEL} data-testid="decision-register-timeline-panel">
          <DecisionRegisterTimeline decisions={filteredDecisions} />
        </div>
      ) : null}

      {!loading && !loadError && hasFilteredResults && viewMode === "cards" ? (
        <div
          className="grid gap-4"
          aria-label={DECISION_REGISTER_VIEW_CARDS_PANEL_LABEL}
          data-testid="decision-register-cards"
        >
          {filteredDecisions.map((decision) => (
            <DecisionRegisterDecisionCard key={`${decision.manifestId}-${decision.decisionId}`} decision={decision} />
          ))}
        </div>
      ) : null}

      {scopedRunFilterActive ? <DecisionRegisterNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}
