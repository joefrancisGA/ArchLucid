"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildStandardsRulesGovernanceBannerModel,
  buildStandardsRulesReviewContextModel,
} from "@/lib/governance/governance-resolution-page-presentation";
import { GOVERNANCE_STANDARDS_AND_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { governanceResolutionUsesShowcaseRuleRows } from "@/lib/governance/governance-resolution-showcase";
import {
  parseStandardsRulesSearchQuery,
  parseStandardsRulesSeverityFromSearch,
  parseStandardsRulesLinkedFindingsFromSearch,
  parseStandardsRulesEvidenceCoverageFromSearch,
  parseStandardsRulesEnforcementFromSearch,
  parseStandardsRulesFrameworkFromSearch,
  parseStandardsRulesPackFromSearch,
  standardsRulesClearSearchHrefFromSearch,
  standardsRulesSearchHrefFromSearch,
} from "@/lib/governance/standards-rules-filters-url";
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
  const pathname = usePathname() ?? GOVERNANCE_STANDARDS_AND_RULES_PATH;
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const urlSearchQuery = parseStandardsRulesSearchQuery(searchParams.get("q"));
  const urlSeverity = parseStandardsRulesSeverityFromSearch(searchParams.get("severity"));
  const urlLinkedFindings = parseStandardsRulesLinkedFindingsFromSearch(searchParams.get("linkedFindings"));
  const urlEvidenceCoverage = parseStandardsRulesEvidenceCoverageFromSearch(searchParams.get("evidenceCoverage"));
  const urlEnforcement = parseStandardsRulesEnforcementFromSearch(searchParams.get("enforcement"));
  const urlFramework = parseStandardsRulesFrameworkFromSearch(searchParams.get("framework"));
  const urlPack = parseStandardsRulesPackFromSearch(searchParams.get("pack"));
  const [filters, setFiltersState] = useState({
    ...EMPTY_STANDARDS_RULES_FILTER_STATE,
    searchQuery: urlSearchQuery,
    severity: urlSeverity,
    linkedFindings: urlLinkedFindings,
    evidenceCoverage: urlEvidenceCoverage,
    enforcementMode: urlEnforcement,
    standardFramework: urlFramework,
    sourcePolicyPack: urlPack,
  });
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);

  useEffect(() => {
    setFiltersState((current) => ({
      ...current,
      searchQuery: urlSearchQuery,
      severity: urlSeverity,
      linkedFindings: urlLinkedFindings,
      evidenceCoverage: urlEvidenceCoverage,
      enforcementMode: urlEnforcement,
      standardFramework: urlFramework,
      sourcePolicyPack: urlPack,
    }));
    setSearchQuery(urlSearchQuery);
  }, [urlEnforcement, urlEvidenceCoverage, urlFramework, urlLinkedFindings, urlPack, urlSearchQuery, urlSeverity]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = standardsRulesSearchHrefFromSearch(searchParams.toString(), searchQuery, pathname);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [pathname, router, searchParams, searchQuery]);

  const setFilters = useCallback((
    next: typeof filters | ((current: typeof filters) => typeof filters),
  ): void => {
    setFiltersState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;

      setSearchQuery(resolved.searchQuery);

      return resolved;
    });
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    router.replace(standardsRulesClearSearchHrefFromSearch(currentSearch, pathname), { scroll: false });
  }, [currentSearch, pathname, router]);

  const onPickRun = useCallback(
    (runId: string) => {
      const trimmed = runId.trim();

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
    currentSearch,
    pathname,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    clearSearch,
    onPickRun,
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
