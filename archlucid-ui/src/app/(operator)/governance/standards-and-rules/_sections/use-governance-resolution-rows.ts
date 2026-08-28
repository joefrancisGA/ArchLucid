"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  buildStandardsRulesGovernanceBannerModel,
  buildStandardsRulesReviewContextModel,
} from "@/lib/governance/governance-resolution-page-presentation";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { governanceResolutionUsesShowcaseRuleRows } from "@/lib/governance/governance-resolution-showcase";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import {
  buildStandardsRuleRows,
  buildStandardsRulesSummary,
  collectStandardsRulesFilterOptions,
  EMPTY_STANDARDS_RULES_FILTER_STATE,
  filterStandardsRuleRows,
} from "@/lib/standards-rules-rows";
import { resolveFirstUnmatchedStandardsRule } from "@/lib/resolve-first-unmatched-standards-rule";
import {
  resolveStandardsRulesResolveEmphasizedStepId,
  resolveStandardsRulesResolveSteps,
} from "@/lib/standards-rules-resolve-checklist";
import {
  STANDARDS_RULES_LAST_REFRESHED_PREFIX,
  STANDARDS_RULES_REFRESHING_STATUS,
} from "@/lib/standards-rules-page";

import type { GovernanceResolutionPageViewModel } from "./governance-resolution-page-view-model";

export function useGovernanceResolutionRows(model: GovernanceResolutionPageViewModel) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const [filters, setFilters] = useState(EMPTY_STANDARDS_RULES_FILTER_STATE);

  const onPickReview = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_STANDARDS_AND_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const allRuleRows = useMemo(
    () =>
      buildStandardsRuleRows(model.data, {
        useShowcaseFallback: model.buyerPolishedShell && model.failure === null,
      }),
    [model.buyerPolishedShell, model.data, model.failure],
  );
  const filteredRuleRows = useMemo(() => filterStandardsRuleRows(allRuleRows, filters), [allRuleRows, filters]);
  const firstUnmatchedRule = useMemo(() => resolveFirstUnmatchedStandardsRule(allRuleRows), [allRuleRows]);
  const summary = useMemo(() => buildStandardsRulesSummary(allRuleRows), [allRuleRows]);
  const filterOptions = useMemo(() => collectStandardsRulesFilterOptions(allRuleRows), [allRuleRows]);
  const useShowcaseFallback = model.buyerPolishedShell;
  const usesShowcaseRuleRows =
    model.buyerPolishedShell &&
    model.failure === null &&
    governanceResolutionUsesShowcaseRuleRows(model.data) &&
    allRuleRows.length > 0;
  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: STANDARDS_RULES_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: model.loading ? null : model.lastRefreshedAt,
    refreshingLabel: model.loading ? STANDARDS_RULES_REFRESHING_STATUS : null,
  });
  const showTableSkeleton = model.loading && allRuleRows.length > 0;
  const showRulesTable = !model.loading && filteredRuleRows.length > 0;
  const governanceBanner = useMemo(
    () =>
      model.failure === null
        ? buildStandardsRulesGovernanceBannerModel({
            data: model.data,
            useShowcaseFallback,
          })
        : null,
    [model.data, model.failure, useShowcaseFallback],
  );
  const reviewContext = useMemo(
    () =>
      model.failure === null
        ? buildStandardsRulesReviewContextModel({
            data: model.data,
            contributingPolicyPacks: summary.contributingPolicyPacks,
            useShowcaseFallback,
          })
        : null,
    [model.data, model.failure, summary.contributingPolicyPacks, useShowcaseFallback],
  );
  const standardsRulesResolveChecklistSteps = resolveStandardsRulesResolveSteps({
    reviewPicked: scopedRunFilterActive,
    rulesFiltered: scopedRunFilterActive && filteredRuleRows.length < allRuleRows.length,
    resolveReady: scopedRunFilterActive && showRulesTable,
  });
  const standardsRulesResolveChecklistEmphasizedStepId = resolveStandardsRulesResolveEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    rulesFiltered: scopedRunFilterActive && filteredRuleRows.length < allRuleRows.length,
    resolveReady: scopedRunFilterActive && showRulesTable,
  });

  return {
    scopedRunId,
    scopedRunFilterActive,
    filters,
    setFilters,
    onPickReview,
    allRuleRows,
    filteredRuleRows,
    firstUnmatchedRule,
    summary,
    filterOptions,
    usesShowcaseRuleRows,
    freshnessLabel,
    showTableSkeleton,
    showRulesTable,
    governanceBanner,
    reviewContext,
    standardsRulesResolveChecklistSteps,
    standardsRulesResolveChecklistEmphasizedStepId,
  };
}
