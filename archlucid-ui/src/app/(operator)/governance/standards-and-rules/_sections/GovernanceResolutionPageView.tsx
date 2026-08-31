"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { GovernanceResolutionRankCue } from "@/components/EnterpriseControlsContextHints";
import { GovernanceStandardsRulesBreadcrumb } from "@/components/governance/GovernanceStandardsRulesBreadcrumb";
import { StandardsRulesGovernanceStatusBanner } from "@/components/governance/StandardsRulesGovernanceStatusBanner";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorDemoStaticBanner } from "@/components/operator/OperatorDemoStaticBanner";
import { OperatorEvidenceLimitsFooter } from "@/components/operator/OperatorEvidenceLimitsFooter";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/governance/GovernanceSetupConfigHubsVocabularyRail";
import { PolicyPacksStandardsVocabularyRail } from "@/components/policy/PolicyPacksStandardsVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  governanceResolutionPageLeadOperator,
  governanceResolutionPageLeadReader,
} from "@/lib/enterprise-controls-context-copy";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { EMPTY_STANDARDS_RULES_FILTER_STATE } from "@/lib/standards-rules-rows";
import {
  STANDARDS_RULES_FILTER_NO_MATCH_BODY,
  STANDARDS_RULES_FILTER_NO_MATCH_TITLE,
  STANDARDS_RULES_LOAD_RETRY_LABEL,
  STANDARDS_RULES_PAGE_SUBTITLE,
  STANDARDS_RULES_PAGE_TITLE,
  STANDARDS_RULES_RESET_FILTERS,
} from "@/lib/standards-rules-page";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { Button } from "@/components/ui/button";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import { GovernanceResolutionExportControls } from "./GovernanceResolutionExportControls";
import { GovernanceResolutionOperatorDiagnostics } from "./GovernanceResolutionOperatorDiagnostics";
import { StandardsRulesEmptyState } from "./StandardsRulesEmptyState";
import { StandardsRulesFilters } from "./StandardsRulesFilters";
import { StandardsRulesApplyFirstUnmatchedStrip } from "./StandardsRulesApplyFirstUnmatchedStrip";
import { GovernanceStandardsRulesNextReviewFooterClient } from "./GovernanceStandardsRulesNextReviewFooterClient";
import { StandardsRulesPickReviewBeforeResolvingStrip } from "./StandardsRulesPickReviewBeforeResolvingStrip";
import { StandardsRulesReviewContextRow } from "./StandardsRulesReviewContextRow";
import { StandardsRulesSummaryStrip } from "./StandardsRulesSummaryStrip";
import { StandardsRulesTable } from "./StandardsRulesTable";
import { StandardsRulesTableSkeleton } from "./StandardsRulesTableSkeleton";
import { useGovernanceResolutionRows } from "./use-governance-resolution-rows";

type Props = {
  readonly model: GovernanceResolutionPageViewModel;
};

export function GovernanceResolutionPageView(props: Props) {
  const m = props.model;
  const rows = useGovernanceResolutionRows(m);

  const scopedRunBanner = rows.scopedRunFilterActive ? (
    <p
      className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
      data-testid="standards-and-rules-run-scope-banner"
    >
      {"Resolving standards and rules for review "}
      <span className="font-mono text-al-text-primary">{rows.scopedRunId}</span>
      {" · "}
      <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={GOVERNANCE_STANDARDS_AND_RULES_PATH}>
        Clear review scope
      </Link>
      {" · "}
      <Link
        className={OPERATOR_BODY_INLINE_LINK_CLASS}
        href={`/architecture/reviews/${encodeURIComponent(rows.scopedRunId)}`}
      >
        Open review
      </Link>
    </p>
  ) : null;

  if (m.buyerPolishedShell) {
    return (
      <OperatorPageContainer variant="dashboard">
        {rows.usesShowcaseRuleRows ? (
          <div className="mb-3">
            <OperatorDemoStaticBanner emphasizeSampleData />
          </div>
        ) : null}
        {rows.governanceBanner !== null ? (
          <StandardsRulesGovernanceStatusBanner
            className="mb-3"
            subjectLabel={rows.governanceBanner.subjectLabel}
            provenance={rows.governanceBanner.provenance}
            hrefs={rows.governanceBanner.hrefs}
          />
        ) : null}
        <OperatorPageHeader
          navHref={GOVERNANCE_STANDARDS_AND_RULES_PATH}
          title={STANDARDS_RULES_PAGE_TITLE}
          subtitle={STANDARDS_RULES_PAGE_SUBTITLE}
          breadcrumb={<GovernanceStandardsRulesBreadcrumb />}
          actions={<PageContextualHelpButton />}
        />
        <PolicyPacksStandardsVocabularyRail currentSurfaceId="standards-and-rules" variant="compact" />
        {m.failure !== null ? (
          <div className="mb-4 space-y-3" role="alert" data-testid="standards-rules-load-failure">
            <OperatorApiProblem failure={m.failure} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="standards-rules-load-retry"
              disabled={m.loading}
              onClick={() => {
                void m.load();
              }}
            >
              {STANDARDS_RULES_LOAD_RETRY_LABEL}
            </Button>
          </div>
        ) : null}
        {m.failure === null ? (
          <>
            {!rows.scopedRunFilterActive ? (
              <StandardsRulesPickReviewBeforeResolvingStrip selectedReviewId="" onSelectReview={rows.onPickRun} />
            ) : (
              <>
                {scopedRunBanner}
                <IntegrationConnectChecklist
                  title="Resolve checklist"
                  steps={rows.standardsRulesResolveChecklistSteps}
                  emphasizedStepId={rows.standardsRulesResolveChecklistEmphasizedStepId}
                  testIdPrefix="standards-rules-resolve"
                />
              </>
            )}
            {rows.reviewContext !== null ? <StandardsRulesReviewContextRow context={rows.reviewContext} /> : null}
            <div className="mb-4">
              <OperatorPageFreshnessMetadata
                testId="standards-rules-last-refreshed"
                lastRefreshedAt={m.loading ? null : m.lastRefreshedAt}
              >
                {rows.freshnessLabel}
              </OperatorPageFreshnessMetadata>
            </div>
            <StandardsRulesSummaryStrip
              summary={rows.summary}
              onApplyFilter={(partial) => {
                rows.setFilters((current) => ({ ...current, ...partial }));
              }}
            />
            {rows.firstUnmatchedRule !== null ? (
              <StandardsRulesApplyFirstUnmatchedStrip
                target={rows.firstUnmatchedRule}
                onApplyFilter={() => {
                  rows.setFilters((current) => ({ ...current, linkedFindings: "unlinked" }));
                }}
              />
            ) : null}
            <StandardsRulesFilters
              filters={rows.filters}
              visibleCount={rows.filteredRuleRows.length}
              totalCount={rows.allRuleRows.length}
              options={rows.filterOptions}
              onChange={rows.setFilters}
              onReset={() => {
                rows.setFilters(EMPTY_STANDARDS_RULES_FILTER_STATE);
              }}
              onRefresh={() => {
                void m.load();
              }}
              refreshing={m.loading}
            />
          </>
        ) : null}
        <GovernanceResolutionExportControls compact exportRows={rows.filteredRuleRows} model={m} />
        {m.failure === null ? (
          <>
            {rows.allRuleRows.length === 0 && !m.loading ? (
              <StandardsRulesEmptyState />
            ) : null}
            {!m.loading && rows.allRuleRows.length > 0 && rows.filteredRuleRows.length === 0 ? (
              <EnterpriseCompactEmptyState
                testId="standards-rules-filter-no-match-empty-state"
                title={STANDARDS_RULES_FILTER_NO_MATCH_TITLE}
                description={STANDARDS_RULES_FILTER_NO_MATCH_BODY}
                footer={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    data-testid="standards-rules-clear-filters"
                    onClick={() => {
                      rows.setFilters(EMPTY_STANDARDS_RULES_FILTER_STATE);
                    }}
                  >
                    {STANDARDS_RULES_RESET_FILTERS}
                  </Button>
                }
              />
            ) : null}
            {rows.showTableSkeleton ? <StandardsRulesTableSkeleton rowCount={Math.max(rows.allRuleRows.length, 3)} /> : null}
            {rows.showRulesTable ? <StandardsRulesTable rows={rows.filteredRuleRows} /> : null}
            {rows.usesShowcaseRuleRows ? (
              <OperatorEvidenceLimitsFooter runId={SHOWCASE_STATIC_DEMO_RUN_ID} showArchitectureReviewSummaryLink={false} />
            ) : null}
            {rows.scopedRunFilterActive ? (
              <GovernanceStandardsRulesNextReviewFooterClient runId={rows.scopedRunId} />
            ) : null}
          </>
        ) : null}
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="workflow">
      <LayerHeader pageKey="governance-resolution" density="compact"
/>
      <OperatorPageHeader
        navHref={GOVERNANCE_STANDARDS_AND_RULES_PATH}
        title={OPERATOR_NAV_LINK_LABELS.governanceResolution}
        subtitle={m.canMutateEnterprisePolicySurfaces ? governanceResolutionPageLeadOperator : governanceResolutionPageLeadReader}
        breadcrumb={<GovernanceStandardsRulesBreadcrumb />}
        actions={<PageContextualHelpButton />}
      />
      <PolicyPacksStandardsVocabularyRail currentSurfaceId="standards-and-rules" />
      <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="standards" />
      <GovernanceResolutionRankCue className="mb-3" />
      {!rows.scopedRunFilterActive ? (
        <StandardsRulesPickReviewBeforeResolvingStrip selectedReviewId="" onSelectReview={rows.onPickRun} />
      ) : (
        <>
          {scopedRunBanner}
          <IntegrationConnectChecklist
            title="Resolve checklist"
            steps={rows.standardsRulesResolveChecklistSteps}
            emphasizedStepId={rows.standardsRulesResolveChecklistEmphasizedStepId}
            testIdPrefix="standards-rules-resolve"
          />
        </>
      )}
      {m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}
      <GovernanceResolutionOperatorDiagnostics model={m} />
      {rows.scopedRunFilterActive ? (
        <GovernanceStandardsRulesNextReviewFooterClient runId={rows.scopedRunId} />
      ) : null}
    </OperatorPageContainer>
  );
}
