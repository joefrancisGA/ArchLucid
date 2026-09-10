"use client";

import Link from "next/link";

import { DecisionRegisterTimeline } from "@/components/DecisionRegisterTimeline";
import { DecisionRegisterEmptyTeaching } from "@/components/DecisionRegisterEmptyTeaching";
import { DecisionRegisterFindingsVocabularyRail } from "@/components/DecisionRegisterFindingsVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { GovernanceJobRouterStrip } from "@/components/governance/GovernanceJobRouterStrip";
import { LayerHeader } from "@/components/LayerHeader";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { BUYER_GOVERNANCE_DECISION_REGISTER_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { DECISION_REGISTER_CLAIM_DISCIPLINE } from "@/lib/decision-register-evidence-copy";
import {
  GOVERNANCE_DECISION_REGISTER_BUYER_START_HERE_HELPER,
  GOVERNANCE_DECISION_REGISTER_LOAD_ERROR,
  GOVERNANCE_DECISION_REGISTER_PAGE_LEAD,
  GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID,
  GOVERNANCE_DECISION_REGISTER_SKIP_LINK_LABEL,
} from "@/lib/governance-decision-register-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

import { DecisionRegisterBreadcrumb } from "./_sections/DecisionRegisterBreadcrumb";
import { DecisionRegisterBuyerChrome } from "./_sections/DecisionRegisterBuyerChrome";
import { DecisionRegisterLoadFailure } from "./_sections/DecisionRegisterLoadFailure";
import { DecisionRegisterLoadingSkeleton } from "./_sections/DecisionRegisterLoadingSkeleton";
import { DecisionRegisterDecisionCard } from "./DecisionRegisterDecisionCard";
import { DecisionRegisterContinueLastViewedRow } from "./DecisionRegisterContinueLastViewedRow";
import { DecisionRegisterViewEmptyShell } from "./DecisionRegisterViewEmptyShell";
import { DecisionRegisterExportButton } from "./DecisionRegisterExportButton";
import { DecisionRegisterFiltersPanel } from "./DecisionRegisterFiltersPanel";
import { DecisionRegisterSummaryRow } from "./DecisionRegisterSummaryRow";
import { DecisionRegisterViewSwitcher } from "./DecisionRegisterViewSwitcher";
import { DecisionRegisterWorkspaceActiveApprovalStrip } from "./DecisionRegisterWorkspaceActiveApprovalStrip";
import { DecisionRegisterPickReviewBeforeFilteringStrip } from "./DecisionRegisterPickReviewBeforeFilteringStrip";
import { DecisionRegisterNextReviewFooterClient } from "./DecisionRegisterNextReviewFooterClient";
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
import type { DecisionRegisterPageViewModel } from "./use-decision-register-page";

export type DecisionRegisterPageShellProps = DecisionRegisterPageViewModel;

export function DecisionRegisterPageShell(props: DecisionRegisterPageShellProps) {
  const {
    buyerPolishedShell,
    currentSearch,
    scopedRunId,
    scopedRunFilterActive,
    datePreset,
    viewMode,
    category,
    setCategory,
    recordedAfter,
    setRecordedAfter,
    recordedBefore,
    setRecordedBefore,
    minConfidence,
    setMinConfidence,
    maxConfidence,
    setMaxConfidence,
    confidenceBasis,
    setConfidenceBasis,
    retryLoad,
    summary,
    continueLastDecision,
    collapseAdvancedFilters,
    loading,
    hasWorkspaceDecisions,
    hasFilteredResults,
    filtersExcludeMatches,
    filteredDecisions,
    loadError,
    decisionRegisterFilterChecklistSteps,
    decisionRegisterFilterChecklistEmphasizedStepId,
    onPickReviewForFiltering,
    resetFilters,
    clearCustomDatePreset,
  } = props;

  return (
    <OperatorPageContainer
      variant={buyerPolishedShell ? "workflow" : "dashboard"}
      className={cn("space-y-4 p-4", OPERATOR_LAYOUT.sectionStack)}
      data-testid="decision-register-page"
    >
      {buyerPolishedShell ? (
        <a
          href={`#${GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_DECISION_REGISTER_SKIP_LINK_LABEL}
        </a>
      ) : null}

      {buyerPolishedShell ? (
        <LayerHeader pageKey="decision-register" density="compact" />
      ) : null}

      <OperatorPageHeader
        navHref={GOVERNANCE_DECISION_REGISTER_PATH}
        title={BUYER_GOVERNANCE_DECISION_REGISTER_TITLE}
        subtitle={decisionRegisterPageSubtitle(buyerPolishedShell)}
        claimDiscipline={DECISION_REGISTER_CLAIM_DISCIPLINE}
        claimDisciplineTestId="decision-register-claim-discipline"
        breadcrumb={<DecisionRegisterBreadcrumb />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            <DecisionRegisterExportButton decisions={filteredDecisions} disabled={loading || loadError !== null} />
            <DecisionRegisterViewSwitcher viewMode={viewMode} currentSearch={currentSearch} />
          </div>
        }
      />

      <GovernanceJobRouterStrip currentJobId="record-decisions" />

      {buyerPolishedShell ? null : (
        <DecisionRegisterFindingsVocabularyRail currentSurfaceId="decision-register" />
      )}

      <div
        id={buyerPolishedShell ? GOVERNANCE_DECISION_REGISTER_PRIMARY_CONTENT_ID : undefined}
        className={cn(buyerPolishedShell ? "scroll-mt-24" : undefined, OPERATOR_LAYOUT.sectionStack)}
        data-testid={
          buyerPolishedShell ? "governance-decision-register-primary-content" : "decision-register-page-body"
        }
      >
        {buyerPolishedShell ? (
          <div
            className="space-y-4 border-b border-neutral-200 pb-6 dark:border-neutral-800"
            data-testid="governance-decision-register-first-viewport"
          >
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
              data-testid="governance-decision-register-intro"
            >
              {GOVERNANCE_DECISION_REGISTER_PAGE_LEAD}
            </p>
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="governance-decision-register-buyer-start-here-helper"
            >
              {GOVERNANCE_DECISION_REGISTER_BUYER_START_HERE_HELPER}
            </p>
          </div>
        ) : null}

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
            currentSearch={currentSearch}
            collapseAdvanced={collapseAdvancedFilters}
            onCategoryChange={setCategory}
            onRecordedAfterChange={(value) => {
              setRecordedAfter(value);
              clearCustomDatePreset();
            }}
            onRecordedBeforeChange={(value) => {
              setRecordedBefore(value);
              clearCustomDatePreset();
            }}
            onMinConfidenceChange={setMinConfidence}
            onMaxConfidenceChange={setMaxConfidence}
            onConfidenceBasisChange={setConfidenceBasis}
            onClearFilters={resetFilters}
          />
        ) : null}

        {!loading && !loadError && continueLastDecision !== null ? (
          <DecisionRegisterContinueLastViewedRow decision={continueLastDecision} scopedRunId={scopedRunId} />
        ) : null}

        {loading ? <DecisionRegisterLoadingSkeleton /> : null}

        {loadError && buyerPolishedShell ? (
          <DecisionRegisterLoadFailure message={GOVERNANCE_DECISION_REGISTER_LOAD_ERROR} onRetry={retryLoad} />
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
        {buyerPolishedShell ? <DecisionRegisterBuyerChrome /> : null}
      </div>
    </OperatorPageContainer>
  );
}
