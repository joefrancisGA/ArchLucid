"use client";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { Button } from "@/components/ui/button";
import { EMPTY_STANDARDS_RULES_FILTER_STATE } from "@/lib/standards-rules-rows";
import {
  STANDARDS_RULES_FILTER_NO_MATCH_BODY,
  STANDARDS_RULES_FILTER_NO_MATCH_TITLE,
  STANDARDS_RULES_RESET_FILTERS,
} from "@/lib/standards-rules-page";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { STANDARDS_RULES_EMPTY_NOT_LOAD_FAILURE_LINE } from "@/lib/governance/standards-rules-empty-not-load-failure-copy";
import { cn } from "@/lib/utils";

import { GovernanceResolutionExportControls } from "./GovernanceResolutionExportControls";
import { StandardsRulesApplyFirstUnmatchedStrip } from "./StandardsRulesApplyFirstUnmatchedStrip";
import { StandardsRulesEmptyState } from "./StandardsRulesEmptyState";
import { StandardsRulesFilters } from "./StandardsRulesFilters";
import { StandardsRulesFilterPartialHonesty } from "./StandardsRulesFilterPartialHonesty";
import { StandardsRulesReviewContextRow } from "./StandardsRulesReviewContextRow";
import { StandardsRulesSummaryStrip } from "./StandardsRulesSummaryStrip";
import { StandardsRulesTable } from "./StandardsRulesTable";
import { StandardsRulesTableSkeleton } from "./StandardsRulesTableSkeleton";
import { StandardsRulesWorkingFilterPartialHonesty } from "./StandardsRulesWorkingFilterPartialHonesty";
import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";
import type { useGovernanceResolutionRows } from "./use-governance-resolution-rows";

export type StandardsRulesWorkingRulesSectionProps = {
  readonly model: GovernanceResolutionPageViewModel;
  readonly rows: ReturnType<typeof useGovernanceResolutionRows>;
};

export function StandardsRulesWorkingRulesSection(props: StandardsRulesWorkingRulesSectionProps): React.JSX.Element {
  const m = props.model;
  const rows = props.rows;

  return (
    <section className="space-y-4" aria-label="Standards rules catalog" data-testid="standards-rules-working-catalog">
      {rows.reviewContext !== null ? <StandardsRulesReviewContextRow context={rows.reviewContext} /> : null}
      <div className="mb-4">
        <OperatorPageFreshnessMetadata testId="standards-rules-working-last-refreshed" lastRefreshedAt={m.loading ? null : m.lastRefreshedAt}>
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
        currentSearch={rows.currentSearch}
        pathname={rows.pathname}
        searchQuery={rows.searchQuery}
        onSearchQueryChange={rows.setSearchQuery}
        onClearSearch={rows.clearSearch}
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
      <GovernanceResolutionExportControls compact exportRows={rows.filteredRuleRows} model={m} />
      {rows.allRuleRows.length === 0 && !m.loading ? <StandardsRulesEmptyState /> : null}
      {!m.loading && rows.allRuleRows.length > 0 && rows.filteredRuleRows.length === 0 ? (
        <EnterpriseCompactEmptyState
          testId="standards-rules-working-filter-no-match-empty-state"
          title={STANDARDS_RULES_FILTER_NO_MATCH_TITLE}
          description={STANDARDS_RULES_FILTER_NO_MATCH_BODY}
          footer={
            <div className="grid gap-2">
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="standards-rules-working-filter-empty-not-load-failure">
                {STANDARDS_RULES_EMPTY_NOT_LOAD_FAILURE_LINE}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="standards-rules-working-clear-filters"
                onClick={() => {
                  rows.setFilters(EMPTY_STANDARDS_RULES_FILTER_STATE);
                }}
              >
                {STANDARDS_RULES_RESET_FILTERS}
              </Button>
              <StandardsRulesFilterPartialHonesty />
              <StandardsRulesWorkingFilterPartialHonesty />
            </div>
          }
        />
      ) : null}
      {rows.showTableSkeleton ? <StandardsRulesTableSkeleton rowCount={Math.max(rows.allRuleRows.length, 3)} /> : null}
      {rows.showRulesTable ? <StandardsRulesTable rows={rows.filteredRuleRows} /> : null}
    </section>
  );
}