"use client";

import {
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { GovernanceConflictsTable } from "@/components/governance/GovernanceConflictsTable";
import { GovernanceResolutionRankCue } from "@/components/EnterpriseControlsContextHints";
import { GovernanceStandardsRulesBreadcrumb } from "@/components/governance/GovernanceStandardsRulesBreadcrumb";
import { StandardsRulesGovernanceStatusBanner } from "@/components/governance/StandardsRulesGovernanceStatusBanner";
import { GlossaryTooltip } from "@/components/GlossaryTooltip";
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
  buildStandardsRulesGovernanceBannerModel,
  buildStandardsRulesReviewContextModel,
} from "@/lib/governance/governance-resolution-page-presentation";
import {
  governanceResolutionEffectivePolicyHeadingOperator,
  governanceResolutionEffectivePolicyHeadingReader,
  governanceResolutionPageLeadOperator,
  governanceResolutionPageLeadReader,
  governanceResolutionRawOutputAccordionLabel,
  governanceResolutionResolutionDetailsHeadingOperator,
  governanceResolutionResolutionDetailsHeadingReader,
} from "@/lib/enterprise-controls-context-copy";
import {
  OPERATOR_DISCLOSURE_TRIGGER_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH, governancePolicyPackDetailPath } from "@/lib/governance/governance-route-paths";
import { governanceResolutionUsesShowcaseRuleRows } from "@/lib/governance/governance-resolution-showcase";
import { policyPackBuyerGovernanceDetailHref } from "@/lib/policy/policy-pack-buyer-label";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  buildStandardsRuleRows,
  buildStandardsRulesSummary,
  collectStandardsRulesFilterOptions,
  EMPTY_STANDARDS_RULES_FILTER_STATE,
  filterStandardsRuleRows,
  resolveStandardsRulesPolicyPackProvenanceLabel,
} from "@/lib/standards-rules-rows";
import { resolveFirstUnmatchedStandardsRule } from "@/lib/resolve-first-unmatched-standards-rule";
import {
  STANDARDS_RULES_FILTER_NO_MATCH_BODY,
  STANDARDS_RULES_FILTER_NO_MATCH_TITLE,
  STANDARDS_RULES_LAST_REFRESHED_PREFIX,
  STANDARDS_RULES_LOAD_RETRY_LABEL,
  STANDARDS_RULES_PAGE_SUBTITLE,
  STANDARDS_RULES_PAGE_TITLE,
  STANDARDS_RULES_REFRESHING_STATUS,
  STANDARDS_RULES_RESET_FILTERS,
} from "@/lib/standards-rules-page";
import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import { GovernanceResolutionExportControls } from "./GovernanceResolutionExportControls";
import { StandardsRulesEmptyState } from "./StandardsRulesEmptyState";
import { StandardsRulesFilters } from "./StandardsRulesFilters";
import { StandardsRulesApplyFirstUnmatchedStrip } from "./StandardsRulesApplyFirstUnmatchedStrip";
import { StandardsRulesPolicyPackReference } from "./StandardsRulesPolicyPackReference";
import { StandardsRulesReviewContextRow } from "./StandardsRulesReviewContextRow";
import { StandardsRulesSummaryStrip } from "./StandardsRulesSummaryStrip";
import { StandardsRulesTable } from "./StandardsRulesTable";
import { StandardsRulesTableSkeleton } from "./StandardsRulesTableSkeleton";
import { Button } from "@/components/ui/button";
type Props = {
  readonly model: GovernanceResolutionPageViewModel;
};

function GovernanceResolutionOperatorDiagnostics(props: { readonly model: GovernanceResolutionPageViewModel }) {
  const m = props.model;
  const canMutateEnterprisePolicySurfaces = m.canMutateEnterprisePolicySurfaces;

  return (
    <>
      <section className="mb-7" aria-labelledby="governance-conflicts-heading">
        <h3 id="governance-conflicts-heading" className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Policy pack conflicts ({m.data?.conflicts.length ?? 0})
        </h3>
        <p className={cn("mt-1 mb-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          When multiple assigned packs define the same governance item, the higher-precedence pack wins. Use the table to see
          which pack was selected, why, and open losing packs to change their assignment.
        </p>
        {(m.data?.conflicts ?? []).length === 0 ? (
          <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No conflicts detected for the current scope.</p>
        ) : (
          <GovernanceConflictsTable
            conflicts={m.data!.conflicts}
            decisions={m.data!.decisions}
            canEditPolicyPacks={canMutateEnterprisePolicySurfaces}
          />
        )}
      </section>

      <section className="mb-7" aria-labelledby="governance-effective-heading">
        <h3 id="governance-effective-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          <GlossaryTooltip termKey="effective_governance">
            {canMutateEnterprisePolicySurfaces
              ? governanceResolutionEffectivePolicyHeadingOperator
              : governanceResolutionEffectivePolicyHeadingReader}
          </GlossaryTooltip>
        </h3>
        <h4 className={cn("mt-2 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>Summary notes</h4>
        <ul className={OPERATOR_TYPOGRAPHY.body}>
          {(m.data?.notes ?? []).length === 0 ? (
            <li className="text-al-text-secondary">—</li>
          ) : (
            m.data!.notes.map((n) => <li key={n}>{n}</li>)
          )}
        </ul>

        <AdvancedOptionsAccordion className="mt-5" triggerLabel={governanceResolutionRawOutputAccordionLabel}>
          <div className="grid gap-4">
            <h4 className={cn("mt-0 mb-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Effective content</h4>
            <pre
              className={cn(
                "m-0 max-h-[400px] overflow-auto bg-neutral-100 p-3 dark:bg-neutral-800",
                OPERATOR_TYPOGRAPHY.micro,
              )}
            >
              {m.data ? JSON.stringify(m.data.effectiveContent, null, 2) : " — "}
            </pre>
            <details className="max-w-3xl">
              <summary className={cn("cursor-pointer font-semibold text-al-text-secondary", OPERATOR_DISCLOSURE_TRIGGER_CLASS)}>
                How packs are ordered (scope, pins, ties)
              </summary>
              <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                <strong>Project</strong> wins over <strong>Workspace</strong> over <strong>Tenant</strong>. Pinned beats unpinned at the
                same tier; newest assignment breaks ties. Conflicts surface when definitions disagree.
              </p>
            </details>
          </div>
        </AdvancedOptionsAccordion>
      </section>

      <section className="mb-7" aria-labelledby="governance-resolution-details-heading">
        <h3 id="governance-resolution-details-heading" className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {canMutateEnterprisePolicySurfaces
            ? governanceResolutionResolutionDetailsHeadingOperator
            : governanceResolutionResolutionDetailsHeadingReader}
        </h3>
        <h4 className={cn("mt-2 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Resolution decisions ({m.data?.decisions.length ?? 0})
        </h4>
        <div className="grid gap-2.5">
          {(m.data?.decisions ?? []).map((d, i) => (
            <article
              key={`${d.itemType}-${d.itemKey}-${i}`}
              className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 bg-neutral-50 dark:bg-neutral-950"
            >
              <div className={OPERATOR_TYPOGRAPHY.cardTitle}>
                <strong>{d.itemType}</strong> <code>{d.itemKey}</code>
              </div>
              <div className={cn("mt-1.5", OPERATOR_TYPOGRAPHY.body)}>
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
                  <span>Winner:</span>
                  <StandardsRulesPolicyPackReference
                    label={d.winningPolicyPackName}
                    href={
                      d.winningPolicyPackId.trim().length > 0
                        ? policyPackBuyerGovernanceDetailHref(d.winningPolicyPackId) ??
                          governancePolicyPackDetailPath(d.winningPolicyPackId)
                        : null
                    }
                    provenanceLabel={resolveStandardsRulesPolicyPackProvenanceLabel({
                      ruleKey: d.itemKey,
                      policyPackId: d.winningPolicyPackId,
                      data: m.data,
                    })}
                  />
                  <span>
                    ({d.winningVersion}) — scope <code>{d.winningScopeLevel}</code>
                  </span>
                </div>
              </div>
              <div className={cn("mt-1.5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{d.resolutionReason}</div>
              <details className={cn("mt-2", OPERATOR_TYPOGRAPHY.micro)}>
                <summary>All candidates</summary>
                <pre className="overflow-auto max-h-[220px]">{JSON.stringify(d.candidates, null, 2)}</pre>
              </details>
            </article>
          ))}
        </div>
      </section>

      <GovernanceResolutionExportControls model={m} />
    </>
  );
}

export function GovernanceResolutionPageView(props: Props) {
  const m = props.model;
  const [filters, setFilters] = useState(EMPTY_STANDARDS_RULES_FILTER_STATE);
  const allRuleRows = useMemo(
    () =>
      buildStandardsRuleRows(m.data, {
        useShowcaseFallback: m.buyerPolishedShell && m.failure === null,
      }),
    [m.buyerPolishedShell, m.data, m.failure],
  );
  const filteredRuleRows = useMemo(() => filterStandardsRuleRows(allRuleRows, filters), [allRuleRows, filters]);
  const firstUnmatchedRule = useMemo(() => resolveFirstUnmatchedStandardsRule(allRuleRows), [allRuleRows]);
  const summary = useMemo(() => buildStandardsRulesSummary(allRuleRows), [allRuleRows]);
  const filterOptions = useMemo(() => collectStandardsRulesFilterOptions(allRuleRows), [allRuleRows]);
  const useShowcaseFallback = m.buyerPolishedShell;
  const usesShowcaseRuleRows =
    m.buyerPolishedShell && m.failure === null && governanceResolutionUsesShowcaseRuleRows(m.data) && allRuleRows.length > 0;
  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: STANDARDS_RULES_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: m.loading ? null : m.lastRefreshedAt,
    refreshingLabel: m.loading ? STANDARDS_RULES_REFRESHING_STATUS : null,
  });
  const showTableSkeleton = m.loading && allRuleRows.length > 0;
  const showRulesTable = !m.loading && filteredRuleRows.length > 0;
  const governanceBanner = useMemo(
    () =>
      m.failure === null
        ? buildStandardsRulesGovernanceBannerModel({
            data: m.data,
            useShowcaseFallback,
          })
        : null,
    [m.data, m.failure, useShowcaseFallback],
  );
  const reviewContext = useMemo(
    () =>
      m.failure === null
        ? buildStandardsRulesReviewContextModel({
            data: m.data,
            contributingPolicyPacks: summary.contributingPolicyPacks,
            useShowcaseFallback,
          })
        : null,
    [m.data, m.failure, summary.contributingPolicyPacks, useShowcaseFallback],
  );

  if (m.buyerPolishedShell) {
    return (
      <OperatorPageContainer variant="dashboard">
        {usesShowcaseRuleRows ? (
          <div className="mb-3">
            <OperatorDemoStaticBanner emphasizeSampleData />
          </div>
        ) : null}
        {governanceBanner !== null ? (
          <StandardsRulesGovernanceStatusBanner
            className="mb-3"
            subjectLabel={governanceBanner.subjectLabel}
            provenance={governanceBanner.provenance}
            hrefs={governanceBanner.hrefs}
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
            {reviewContext !== null ? <StandardsRulesReviewContextRow context={reviewContext} /> : null}
            <div className="mb-4">
              <OperatorPageFreshnessMetadata
                testId="standards-rules-last-refreshed"
                lastRefreshedAt={m.loading ? null : m.lastRefreshedAt}
              >
                {freshnessLabel}
              </OperatorPageFreshnessMetadata>
            </div>
            <StandardsRulesSummaryStrip
              summary={summary}
              onApplyFilter={(partial) => {
                setFilters((current) => ({ ...current, ...partial }));
              }}
            />
            {firstUnmatchedRule !== null ? (
              <StandardsRulesApplyFirstUnmatchedStrip
                target={firstUnmatchedRule}
                onApplyFilter={() => {
                  setFilters((current) => ({ ...current, linkedFindings: "unlinked" }));
                }}
              />
            ) : null}
            <StandardsRulesFilters
              filters={filters}
              visibleCount={filteredRuleRows.length}
              totalCount={allRuleRows.length}
              options={filterOptions}
              onChange={setFilters}
              onReset={() => {
                setFilters(EMPTY_STANDARDS_RULES_FILTER_STATE);
              }}
              onRefresh={() => {
                void m.load();
              }}
              refreshing={m.loading}
            />
          </>
        ) : null}
        <GovernanceResolutionExportControls compact exportRows={filteredRuleRows} model={m} />
        {m.failure === null ? (
          <>
            {allRuleRows.length === 0 && !m.loading ? (
              <StandardsRulesEmptyState />
            ) : null}
            {!m.loading && allRuleRows.length > 0 && filteredRuleRows.length === 0 ? (
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
                      setFilters(EMPTY_STANDARDS_RULES_FILTER_STATE);
                    }}
                  >
                    {STANDARDS_RULES_RESET_FILTERS}
                  </Button>
                }
              />
            ) : null}
            {showTableSkeleton ? <StandardsRulesTableSkeleton rowCount={Math.max(allRuleRows.length, 3)} /> : null}
            {showRulesTable ? <StandardsRulesTable rows={filteredRuleRows} /> : null}
            {usesShowcaseRuleRows ? (
              <OperatorEvidenceLimitsFooter runId={SHOWCASE_STATIC_DEMO_RUN_ID} showArchitectureReviewSummaryLink={false} />
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
    </OperatorPageContainer>
  );
}
