import { describe, expect, it } from "vitest";

import {
  alertsInboxStatusHrefFromSearch,
  parseAlertsInboxStatusFromSearch,
} from "@/lib/governance/alerts-inbox-status-url";
import {
  parseSignedRecordsListSearchQuery,
  signedRecordsListSearchHrefFromSearch,
} from "@/lib/signed-records/signed-records-list-search";
import {
  resolveReviewFindingsToolbarFilterFromSearchParam,
  reviewFindingsToolbarFilterHrefFromSearch,
} from "@/lib/findings/review-findings-toolbar-filter-url";
import {
  architecturesHubFilterHrefFromSearch,
  parseArchitecturesHubFilter,
  parseArchitecturesHubSearchQuery,
} from "@/lib/architecture/architectures-hub-filters";
import {
  buyerPackageScopeHrefFromSearch,
  parseBuyerPackageScopeFilter,
} from "@/app/(operator)/architecture/reviews/buyer-package-scope-url";
import {
  helpGlossaryCategoryHrefFromSearch,
  helpGlossaryResetFiltersHrefFromSearch,
  parseHelpGlossaryCategoryFilter,
  parseHelpGlossarySearchQuery,
} from "@/lib/help/help-glossary-filters";
import {
  graphScopeModeHrefFromSearch,
  parseGraphScopeModeFromSearch,
} from "@/lib/insights/graph-scope-mode-url";
import {
  parseSignedRecordsListIntegrityFilter,
  signedRecordsListIntegrityHrefFromSearch,
} from "@/lib/signed-records/signed-records-list-integrity-url";
import {
  parseReviewFindingsToolbarSearchQuery,
  reviewFindingsToolbarSearchHrefFromSearch,
} from "@/lib/findings/review-findings-toolbar-search-url";
import {
  reviewFindingsJobViewHrefFromSearch,
} from "@/lib/findings/review-findings-job-view-url";

describe("alerts-inbox-status-url", () => {
  it("defaults missing status to Open and builds chip hrefs", () => {
    expect(parseAlertsInboxStatusFromSearch(null)).toBe("Open");
    expect(alertsInboxStatusHrefFromSearch("runId=abc", "Open")).toBe("/governance/alerts?runId=abc");
    expect(alertsInboxStatusHrefFromSearch("", "Acknowledged")).toBe("/governance/alerts?status=Acknowledged");
  });
});

describe("signed-records-list-search", () => {
  it("round-trips q search param", () => {
    expect(parseSignedRecordsListSearchQuery("sealed")).toBe("sealed");
    expect(signedRecordsListSearchHrefFromSearch("runId=r1", "audit", "/governance/sealed-records")).toBe(
      "/governance/sealed-records?runId=r1&q=audit",
    );
    expect(signedRecordsListSearchHrefFromSearch("q=old", "", "/governance/sealed-records")).toBe(
      "/governance/sealed-records",
    );
  });
});

describe("review-findings-toolbar-filter-url", () => {
  it("resolves and builds findingsFilter hrefs", () => {
    expect(resolveReviewFindingsToolbarFilterFromSearchParam("unresolved")).toBe("unresolved");
    expect(resolveReviewFindingsToolbarFilterFromSearchParam("bogus")).toBe("all");
    expect(
      reviewFindingsToolbarFilterHrefFromSearch("tab=findings", "/architecture/reviews/r1", "critical"),
    ).toBe("/architecture/reviews/r1?tab=findings&findingsFilter=critical");
    expect(reviewFindingsToolbarFilterHrefFromSearch("findingsFilter=critical", "/architecture/reviews/r1", "all")).toBe(
      "/architecture/reviews/r1",
    );
  });
});

describe("wave12 filter url helpers", () => {
  it("architectures hub filter and search params", () => {
    expect(parseArchitecturesHubFilter("draft")).toBe("draft");
    expect(parseArchitecturesHubFilter("bogus")).toBe("all");
    expect(parseArchitecturesHubSearchQuery("vpc")).toBe("vpc");
    expect(architecturesHubFilterHrefFromSearch("q=test", "ready-for-review")).toBe(
      "/architecture/architectures?q=test&filter=ready-for-review",
    );
  });

  it("signed records integrity param", () => {
    expect(parseSignedRecordsListIntegrityFilter("sealed")).toBe("sealed");
    expect(signedRecordsListIntegrityHrefFromSearch("runId=r1", "needs-attention")).toBe(
      "/governance/sealed-records?runId=r1&integrity=needs-attention",
    );
  });

  it("buyer package scope param", () => {
    expect(parseBuyerPackageScopeFilter("finalized")).toBe("finalized");
    expect(buyerPackageScopeHrefFromSearch("page=2", "in_flight", "/architecture/reviews")).toBe(
      "/architecture/reviews?page=2&scope=in_flight",
    );
  });

  it("glossary category and search params", () => {
    expect(parseHelpGlossaryCategoryFilter("evidence")).toBe("evidence");
    expect(parseHelpGlossarySearchQuery("run")).toBe("run");
    expect(helpGlossaryCategoryHrefFromSearch("q=run", "governance")).toBe("/help/glossary?q=run&category=governance");
    expect(helpGlossaryResetFiltersHrefFromSearch("q=run&category=governance")).toBe("/help/glossary");
    expect(helpGlossaryResetFiltersHrefFromSearch("tab=overview&q=run&category=governance")).toBe(
      "/help/glossary?tab=overview",
    );
  });

  it("graph scope mode param", () => {
    expect(parseGraphScopeModeFromSearch("architecture")).toBe("architecture");
    expect(graphScopeModeHrefFromSearch("runId=r1", "decision-subgraph")).toBe(
      "/insights/evidence-graph?runId=r1&graphMode=decision-subgraph",
    );
  });

  it("review findings job view and search params", () => {
    expect(
      reviewFindingsJobViewHrefFromSearch("tab=findings", "/architecture/reviews/r1", "verify-hypotheses"),
    ).toBe("/architecture/reviews/r1?tab=findings&findingJobView=verify-hypotheses");
    expect(parseReviewFindingsToolbarSearchQuery("auth")).toBe("auth");
    expect(reviewFindingsToolbarSearchHrefFromSearch("tab=findings", "/architecture/reviews/r1", "auth")).toBe(
      "/architecture/reviews/r1?tab=findings&q=auth",
    );
  });
});

describe("wave13 filter url helpers", () => {
  it("decision register date range and view params", async () => {
    const { parseDecisionRegisterDatePresetFromSearch, decisionRegisterDatePresetHrefFromSearch } = await import(
      "@/lib/governance/decision-register-date-range-url"
    );
    const { parseDecisionRegisterViewModeFromSearch, decisionRegisterViewModeHrefFromSearch } = await import(
      "@/lib/governance/decision-register-view-url"
    );

    expect(parseDecisionRegisterDatePresetFromSearch("30")).toBe("30");
    expect(decisionRegisterDatePresetHrefFromSearch("runId=r1", "30")).toBe(
      "/governance/decision-register?runId=r1&range=30",
    );
    expect(parseDecisionRegisterViewModeFromSearch("timeline")).toBe("timeline");
    expect(decisionRegisterViewModeHrefFromSearch("runId=r1", "timeline")).toBe(
      "/governance/decision-register?runId=r1&view=timeline",
    );
  });

  it("audit trail view and ai usage metric params", async () => {
    const { parseAuditTrailViewModeFromSearch, auditTrailViewModeHrefFromSearch } = await import(
      "@/lib/governance/audit-trail-view-url"
    );
    const { parseAiUsageDailyMetricFromSearch, aiUsageDailyMetricHrefFromSearch } = await import(
      "@/lib/administration/ai-usage-daily-metric-url"
    );

    expect(parseAuditTrailViewModeFromSearch("story", false)).toBe("story");
    expect(auditTrailViewModeHrefFromSearch("", "story", false)).toBe("/governance/audit?view=story");
    expect(parseAiUsageDailyMetricFromSearch("tokens")).toBe("tokens");
    expect(aiUsageDailyMetricHrefFromSearch("", "tokens")).toBe("/administration/ai-usage?metric=tokens");
  });

  it("findings provenance, runs list search, architectures sort", async () => {
    const {
      parseFindingsOriginFilterFromSearch,
      findingsOriginFilterHrefFromSearch,
      parseFindingsGroundingFilterFromSearch,
      findingsGroundingFilterHrefFromSearch,
    } = await import("@/lib/findings/findings-provenance-url");
    const { parseRunsListSearchQuery, runsListSearchHrefFromSearch } = await import("@/lib/runs/runs-list-search-url");
    const { parseArchitecturesHubSort, architecturesHubSortHrefFromSearch } = await import(
      "@/lib/architecture/architectures-hub-filters"
    );

    expect(parseFindingsOriginFilterFromSearch("AI-generated")).toBe("AI-generated");
    expect(findingsOriginFilterHrefFromSearch("tab=findings", "/architecture/reviews/r1", "AI-generated")).toBe(
      "/architecture/reviews/r1?tab=findings&origin=AI-generated",
    );
    expect(parseFindingsGroundingFilterFromSearch("Evidence-backed")).toBe("Evidence-backed");
    expect(parseRunsListSearchQuery("vpc")).toBe("vpc");
    expect(runsListSearchHrefFromSearch("scope=finalized", "vpc", "/architecture/reviews")).toBe(
      "/architecture/reviews?scope=finalized&q=vpc",
    );
    expect(parseArchitecturesHubSort("name-asc")).toBe("name-asc");
    expect(architecturesHubSortHrefFromSearch("filter=draft", "name-asc")).toBe(
      "/architecture/architectures?filter=draft&sort=name-asc",
    );
  });

  it("graph path only and search review evidence query params", async () => {
    const { parseGraphPathOnlyFromSearch, graphPathOnlyHrefFromSearch } = await import(
      "@/lib/insights/graph-path-only-url"
    );
    const { parseSearchReviewEvidenceQueryFromSearch, searchReviewEvidenceQueryHrefFromSearch } = await import(
      "@/lib/insights/search-review-evidence-query-url"
    );

    expect(parseGraphPathOnlyFromSearch("1")).toBe(true);
    expect(graphPathOnlyHrefFromSearch("runId=r1", true)).toBe("/insights/evidence-graph?runId=r1&pathOnly=1");
    expect(parseSearchReviewEvidenceQueryFromSearch("phi")).toBe("phi");
    expect(searchReviewEvidenceQueryHrefFromSearch("runId=r1", "phi")).toBe(
      "/insights/search-review-evidence?runId=r1&q=phi",
    );
  });
});

describe("wave14 filter url helpers", () => {
  it("runs list sort param", async () => {
    const { parseRunsListSortFromSearch, runsListSortHrefFromSearch } = await import("@/lib/runs/runs-list-sort-url");

    expect(parseRunsListSortFromSearch("created-asc")).toBe("created-asc");
    expect(parseRunsListSortFromSearch("bogus")).toBe("created-desc");
    expect(runsListSortHrefFromSearch("q=vpc", "created-asc", "/architecture/reviews")).toBe(
      "/architecture/reviews?q=vpc&sort=created-asc",
    );
    expect(runsListSortHrefFromSearch("sort=created-asc", "created-desc", "/architecture/reviews")).toBe(
      "/architecture/reviews",
    );
  });

  it("review findings toolbar sort and field filters", async () => {
    const { parseReviewFindingsToolbarSortFromSearch, reviewFindingsToolbarSortHrefFromSearch } = await import(
      "@/lib/findings/review-findings-toolbar-sort-url"
    );
    const {
      parseReviewFindingsOwnerFilterFromSearch,
      reviewFindingsOwnerFilterHrefFromSearch,
      parseReviewFindingsDomainFilterFromSearch,
      reviewFindingsDomainFilterHrefFromSearch,
    } = await import("@/lib/findings/review-findings-toolbar-field-filters-url");

    expect(parseReviewFindingsToolbarSortFromSearch("severity-desc")).toBe("severity-desc");
    expect(
      reviewFindingsToolbarSortHrefFromSearch("tab=findings", "/architecture/reviews/r1", "severity-desc"),
    ).toBe("/architecture/reviews/r1?tab=findings&findingsSort=severity-desc");
    expect(parseReviewFindingsOwnerFilterFromSearch("platform")).toBe("platform");
    expect(reviewFindingsOwnerFilterHrefFromSearch("tab=findings", "/architecture/reviews/r1", "platform")).toBe(
      "/architecture/reviews/r1?tab=findings&owner=platform",
    );
    expect(parseReviewFindingsDomainFilterFromSearch("security")).toBe("security");
    expect(reviewFindingsDomainFilterHrefFromSearch("tab=findings", "/architecture/reviews/r1", "security")).toBe(
      "/architecture/reviews/r1?tab=findings&domain=security",
    );
  });

  it("governance findings group-by and audit date range params", async () => {
    const { parseGovernanceFindingsGroupByResourceFromSearch, governanceFindingsGroupByHrefFromSearch } =
      await import("@/lib/governance/governance-findings-group-by-url");
    const { parseAuditTrailDateRangePresetFromSearch, auditTrailDateRangePresetHrefFromSearch } = await import(
      "@/lib/governance/audit-trail-date-range-url"
    );

    expect(parseGovernanceFindingsGroupByResourceFromSearch("resource")).toBe(true);
    expect(governanceFindingsGroupByHrefFromSearch("runId=r1", true)).toBe(
      "/governance/findings?runId=r1&groupBy=resource",
    );
    expect(parseAuditTrailDateRangePresetFromSearch("7d")).toBe("7d");
    expect(auditTrailDateRangePresetHrefFromSearch("runId=r1", "24h")).toBe("/governance/audit?runId=r1&range=24h");
  });

  it("decision register category and confidence basis params", async () => {
    const {
      parseDecisionRegisterCategoryFromSearch,
      decisionRegisterCategoryHrefFromSearch,
      parseDecisionRegisterConfidenceBasisFromSearch,
      decisionRegisterConfidenceBasisHrefFromSearch,
    } = await import("@/lib/governance/decision-register-advanced-filters-url");

    expect(parseDecisionRegisterCategoryFromSearch("security")).toBe("security");
    expect(decisionRegisterCategoryHrefFromSearch("runId=r1", "security")).toBe(
      "/governance/decision-register?runId=r1&category=security",
    );
    expect(parseDecisionRegisterConfidenceBasisFromSearch("Evidence-backed")).toBe("Evidence-backed");
    expect(decisionRegisterConfidenceBasisHrefFromSearch("runId=r1", "Evidence-backed")).toBe(
      "/governance/decision-register?runId=r1&basis=Evidence-backed",
    );
  });

  it("pattern library, standards rules, settings, and help search params", async () => {
    const {
      parsePatternLibrarySearchQuery,
      patternLibrarySearchHrefFromSearch,
      parsePatternLibraryDomainFromSearch,
      patternLibraryDomainHrefFromSearch,
      parsePatternLibraryPlatformFromSearch,
      patternLibraryPlatformHrefFromSearch,
    } = await import("@/lib/insights/pattern-library-filters-url");
    const {
      parseStandardsRulesSearchQuery,
      standardsRulesSearchHrefFromSearch,
      parseStandardsRulesSeverityFromSearch,
      standardsRulesSeverityHrefFromSearch,
    } = await import("@/lib/governance/standards-rules-filters-url");
    const { parseSettingsMasterSearchQuery, settingsMasterSearchHrefFromSearch } = await import(
      "@/lib/administration/settings-master-search-url"
    );
    const { parseHelpHubSearchQuery, helpHubSearchHrefFromSearch } = await import("@/lib/help/help-hub-search-url");

    expect(parsePatternLibrarySearchQuery("vpc")).toBe("vpc");
    expect(patternLibrarySearchHrefFromSearch("runId=r1", "vpc")).toBe("/insights/patterns?runId=r1&q=vpc");
    expect(parsePatternLibraryDomainFromSearch("Healthcare")).toBe("Healthcare");
    expect(patternLibraryDomainHrefFromSearch("q=vpc", "Healthcare")).toBe("/insights/patterns?q=vpc&domain=Healthcare");
    expect(parsePatternLibraryPlatformFromSearch("AWS")).toBe("AWS");
    expect(patternLibraryPlatformHrefFromSearch("domain=Healthcare", "AWS")).toBe(
      "/insights/patterns?domain=Healthcare&platform=AWS",
    );
    expect(parseStandardsRulesSearchQuery("encryption")).toBe("encryption");
    expect(standardsRulesSearchHrefFromSearch("runId=r1", "encryption")).toBe(
      "/governance/standards-and-rules?runId=r1&q=encryption",
    );
    expect(parseStandardsRulesSeverityFromSearch("high")).toBe("high");
    expect(standardsRulesSeverityHrefFromSearch("q=encryption", "high")).toBe(
      "/governance/standards-and-rules?q=encryption&severity=high",
    );
    expect(parseSettingsMasterSearchQuery("billing")).toBe("billing");
    expect(settingsMasterSearchHrefFromSearch("runId=r1", "billing")).toBe("/administration?runId=r1&q=billing");
    expect(parseHelpHubSearchQuery("export")).toBe("export");
    expect(helpHubSearchHrefFromSearch("tab=guides", "export")).toBe("/help?tab=guides&q=export");
  });
});

describe("wave15 filter url helpers", () => {
  it("architectures hub owner and domain params", async () => {
    const {
      parseArchitecturesHubOwnerFromSearch,
      architecturesHubOwnerHrefFromSearch,
      parseArchitecturesHubDomainFromSearch,
      architecturesHubDomainHrefFromSearch,
    } = await import("@/lib/architecture/architectures-hub-owner-domain-url");

    expect(parseArchitecturesHubOwnerFromSearch("platform-team")).toBe("platform-team");
    expect(architecturesHubOwnerHrefFromSearch("q=vpc", "platform-team")).toBe(
      "/architecture/architectures?q=vpc&owner=platform-team",
    );
    expect(parseArchitecturesHubDomainFromSearch("acme.com")).toBe("acme.com");
    expect(architecturesHubDomainHrefFromSearch("owner=team", "acme.com")).toBe(
      "/architecture/architectures?owner=team&domain=acme.com",
    );
  });

  it("compare finding lifecycle status param", async () => {
    const {
      parseCompareFindingLifecycleStatusFromSearch,
      compareFindingLifecycleStatusHrefFromSearch,
    } = await import("@/lib/compare/compare-finding-lifecycle-status-url");

    expect(parseCompareFindingLifecycleStatusFromSearch("NewlyIdentified")).toBe("NewlyIdentified");
    expect(compareFindingLifecycleStatusHrefFromSearch("priorRunId=a&laterRunId=b", "CandidateResolved")).toBe(
      "/insights/compare-two-reviews?priorRunId=a&laterRunId=b&comparisonStatus=CandidateResolved",
    );
  });

  it("graph node type and search confidence params", async () => {
    const { parseGraphNodeTypeFromSearch, graphNodeTypeHrefFromSearch } = await import(
      "@/lib/insights/graph-node-type-url"
    );
    const {
      parseSearchReviewEvidenceConfidenceFromSearch,
      searchReviewEvidenceConfidenceHrefFromSearch,
    } = await import("@/lib/insights/search-review-evidence-confidence-url");

    expect(parseGraphNodeTypeFromSearch("Finding")).toBe("Finding");
    expect(graphNodeTypeHrefFromSearch("runId=r1", "Finding")).toBe("/insights/evidence-graph?runId=r1&nodeType=Finding");
    expect(parseSearchReviewEvidenceConfidenceFromSearch("high")).toBe("high");
    expect(searchReviewEvidenceConfidenceHrefFromSearch("runId=r1&q=phi", "medium")).toBe(
      "/insights/search-review-evidence?runId=r1&q=phi&confidence=medium",
    );
  });

  it("alerts severity, sealed records range, and ai usage range params", async () => {
    const { parseAlertsInboxSeverityFromSearch, alertsInboxSeverityHrefFromSearch } = await import(
      "@/lib/governance/alerts-inbox-severity-url"
    );
    const { parseSignedRecordsListDateRangeFromSearch, signedRecordsListDateRangeHrefFromSearch } = await import(
      "@/lib/signed-records/signed-records-list-date-range-url"
    );
    const { parseAiUsageDailyRangeFromSearch, aiUsageDailyRangeHrefFromSearch } = await import(
      "@/lib/administration/ai-usage-daily-range-url"
    );

    expect(parseAlertsInboxSeverityFromSearch("Critical")).toBe("Critical");
    expect(alertsInboxSeverityHrefFromSearch("runId=r1", "High")).toBe("/governance/alerts?runId=r1&severity=High");
    expect(parseSignedRecordsListDateRangeFromSearch("7d")).toBe("7d");
    expect(signedRecordsListDateRangeHrefFromSearch("runId=r1", "30d")).toBe(
      "/governance/sealed-records?runId=r1&range=30d",
    );
    expect(parseAiUsageDailyRangeFromSearch("7d")).toBe("7d");
    expect(aiUsageDailyRangeHrefFromSearch("metric=tokens", "7d")).toBe(
      "/administration/ai-usage?metric=tokens&range=7d",
    );
  });

  it("connector category and settings member role/status params", async () => {
    const { parseConnectorOperationsCategoryFromSearch, connectorOperationsCategoryHrefFromSearch } = await import(
      "@/lib/integrations/connector-operations-category-url"
    );
    const {
      parseSettingsRolesMemberRoleFromSearch,
      settingsRolesMemberRoleHrefFromSearch,
      parseSettingsRolesMemberStatusFromSearch,
      settingsRolesMemberStatusHrefFromSearch,
    } = await import("@/lib/administration/settings-roles-member-filters-url");

    expect(parseConnectorOperationsCategoryFromSearch("ticketing")).toBe("ticketing");
    expect(connectorOperationsCategoryHrefFromSearch("", "notifications")).toBe(
      "/administration/connection-status?category=notifications",
    );
    expect(parseSettingsRolesMemberRoleFromSearch("Admin")).toBe("Admin");
    expect(settingsRolesMemberRoleHrefFromSearch("tab=users", "Operator")).toBe(
      "/administration/users?tab=users&role=Operator",
    );
    expect(parseSettingsRolesMemberStatusFromSearch("user")).toBe("user");
    expect(settingsRolesMemberStatusHrefFromSearch("tab=users&role=Admin", "api_key")).toBe(
      "/administration/users?tab=users&role=Admin&status=api_key",
    );
  });
});

describe("wave18 filter url helpers", () => {
  it("findings register filter, pattern adoption/time, and standards framework/pack params", async () => {
    const {
      parseGovernanceFindingsRegisterFilterFromSearch,
      governanceFindingsRegisterFilterHrefFromSearch,
    } = await import("@/lib/governance/governance-findings-register-filter-url");
    const {
      parsePatternLibraryAdoptionFromSearch,
      patternLibraryAdoptionHrefFromSearch,
      parsePatternLibraryTimeRangeFromSearch,
      patternLibraryTimeRangeHrefFromSearch,
    } = await import("@/lib/insights/pattern-library-filters-url");
    const {
      parseStandardsRulesFrameworkFromSearch,
      standardsRulesFrameworkHrefFromSearch,
      parseStandardsRulesPackFromSearch,
      standardsRulesPackHrefFromSearch,
    } = await import("@/lib/governance/standards-rules-filters-url");

    expect(parseGovernanceFindingsRegisterFilterFromSearch("open")).toBe("open");
    expect(governanceFindingsRegisterFilterHrefFromSearch("runId=r1", "stale")).toBe(
      "/governance/findings?runId=r1&filter=stale",
    );
    expect(parsePatternLibraryAdoptionFromSearch("Common")).toBe("Common");
    expect(patternLibraryAdoptionHrefFromSearch("q=vpc", "Emerging")).toBe(
      "/insights/patterns?q=vpc&adoption=Emerging",
    );
    expect(parsePatternLibraryTimeRangeFromSearch("Last 90 days")).toBe("Last 90 days");
    expect(patternLibraryTimeRangeHrefFromSearch("domain=SaaS", "Last 12 months")).toBe(
      "/insights/patterns?domain=SaaS&time=Last+12+months",
    );
    expect(parseStandardsRulesFrameworkFromSearch("SOC 2")).toBe("SOC 2");
    expect(standardsRulesFrameworkHrefFromSearch("q=vpc", "NIST")).toBe(
      "/governance/standards-and-rules?q=vpc&framework=NIST",
    );
    expect(parseStandardsRulesPackFromSearch("baseline")).toBe("baseline");
    expect(standardsRulesPackHrefFromSearch("severity=High", "baseline")).toBe(
      "/governance/standards-and-rules?severity=High&pack=baseline",
    );
  });

  it("standards sort, provenance edge search, and sealed integrity hrefs", async () => {
    const {
      parseStandardsRulesSortKeyFromSearch,
      standardsRulesSortHrefFromSearch,
    } = await import("@/lib/governance/standards-rules-sort-url");
    const {
      parseProvenanceTableEdgeSearchQueryFromSearch,
      provenanceTableEdgeSearchHrefFromSearch,
    } = await import("@/lib/provenance/provenance-workspace-filters-url");
    const { signedRecordsListIntegrityHrefFromSearch } = await import(
      "@/lib/signed-records/signed-records-list-integrity-url"
    );

    expect(parseStandardsRulesSortKeyFromSearch("severity")).toBe("severity");
    expect(standardsRulesSortHrefFromSearch("q=vpc", "severity", false)).toBe(
      "/governance/standards-and-rules?q=vpc&sort=severity&dir=desc",
    );
    expect(parseProvenanceTableEdgeSearchQueryFromSearch("depends-on")).toBe("depends-on");
    expect(
      provenanceTableEdgeSearchHrefFromSearch("q=node-1", "depends-on", "/architecture/reviews/r1/provenance"),
    ).toBe("/architecture/reviews/r1/provenance?q=node-1&edgeQ=depends-on");
    expect(signedRecordsListIntegrityHrefFromSearch("q=phi", "needs-attention")).toBe(
      "/governance/sealed-records?q=phi&integrity=needs-attention",
    );
  });

  it("sponsor report period, ai usage chips, engineering troubleshooting, and decision register dates", async () => {
    const { parseSponsorReportPeriodFromSearch, sponsorReportPeriodHrefFromSearch } = await import(
      "@/lib/insights/sponsor-report-period-url"
    );
    const { parseAiUsageTriggerFromSearch, aiUsageTriggerHrefFromSearch, parseAiUsageStatusFromSearch, aiUsageStatusHrefFromSearch } =
      await import("@/lib/administration/ai-usage-dashboard-filter-url");
    const {
      parseHelpEngineeringTroubleshootingSearchQuery,
      helpEngineeringTroubleshootingSearchHrefFromSearch,
    } = await import("@/lib/help/help-engineering-troubleshooting-search-url");
    const {
      parseDecisionRegisterCustomDateFromSearch,
      decisionRegisterCustomDateHrefFromSearch,
    } = await import("@/lib/governance/decision-register-custom-date-url");
    const { decisionRegisterDatePresetHrefFromSearch } = await import(
      "@/lib/governance/decision-register-date-range-url"
    );

    expect(parseSponsorReportPeriodFromSearch("last-90")).toBe("last-90");
    expect(sponsorReportPeriodHrefFromSearch("", "current-quarter")).toBe(
      "/insights/sponsor-report?range=current-quarter",
    );
    expect(parseAiUsageTriggerFromSearch("manual")).toBe("manual");
    expect(aiUsageTriggerHrefFromSearch("feature=chat", "scheduled", "/administration/ai-usage")).toBe(
      "/administration/ai-usage?feature=chat&trigger=scheduled",
    );
    expect(parseAiUsageStatusFromSearch("budget_blocked")).toBe("budget_blocked");
    expect(aiUsageStatusHrefFromSearch("", "completed", "/administration/ai-usage")).toBe(
      "/administration/ai-usage?status=completed",
    );
    expect(parseHelpEngineeringTroubleshootingSearchQuery("503")).toBe("503");
    expect(helpEngineeringTroubleshootingSearchHrefFromSearch("", "401")).toBe(
      "/help/engineering-troubleshooting?q=401",
    );
    expect(parseDecisionRegisterCustomDateFromSearch("2026-04-10")).toBe("2026-04-10");
    expect(decisionRegisterCustomDateHrefFromSearch("range=90", "2026-04-10", "2026-05-01")).toBe(
      "/governance/decision-register?range=90&from=2026-04-10&to=2026-05-01",
    );
    expect(decisionRegisterDatePresetHrefFromSearch("from=2026-04-10&to=2026-05-01", "30")).toBe(
      "/governance/decision-register?range=30",
    );
  });
});

describe("wave17 filter url helpers", () => {
  it("sealed records search/sort and standards evidence/enforcement params", async () => {
    const { parseSignedRecordsListSearchQuery, signedRecordsListSearchHrefFromSearch } = await import(
      "@/lib/signed-records/signed-records-list-search"
    );
    const {
      parseSignedRecordsListSortKeyFromSearch,
      signedRecordsListSortHrefFromSearch,
    } = await import("@/lib/signed-records/signed-records-list-sort-url");
    const {
      parseStandardsRulesEvidenceCoverageFromSearch,
      standardsRulesEvidenceCoverageHrefFromSearch,
      parseStandardsRulesEnforcementFromSearch,
      standardsRulesEnforcementHrefFromSearch,
    } = await import("@/lib/governance/standards-rules-filters-url");

    expect(parseSignedRecordsListSearchQuery("manifest-1")).toBe("manifest-1");
    expect(signedRecordsListSearchHrefFromSearch("integrity=sealed", "phi")).toBe(
      "/governance/sealed-records?integrity=sealed&q=phi",
    );
    expect(parseSignedRecordsListSortKeyFromSearch("reviewTitle")).toBe("reviewTitle");
    expect(signedRecordsListSortHrefFromSearch("q=phi", "reviewTitle", true)).toBe(
      "/governance/sealed-records?q=phi&sort=reviewTitle&dir=asc",
    );
    expect(parseStandardsRulesEvidenceCoverageFromSearch("unevidenced")).toBe("unevidenced");
    expect(standardsRulesEvidenceCoverageHrefFromSearch("q=vpc", "evidenced")).toBe(
      "/governance/standards-and-rules?q=vpc&evidenceCoverage=evidenced",
    );
    expect(parseStandardsRulesEnforcementFromSearch("Required")).toBe("Required");
    expect(standardsRulesEnforcementHrefFromSearch("severity=High", "Required")).toBe(
      "/governance/standards-and-rules?severity=High&enforcement=Required",
    );
  });

  it("pattern library type/risk, planning theme, and provenance table params", async () => {
    const {
      parsePatternLibraryTypeFromSearch,
      patternLibraryTypeHrefFromSearch,
      parsePatternLibraryRiskFromSearch,
      patternLibraryRiskHrefFromSearch,
    } = await import("@/lib/insights/pattern-library-filters-url");
    const { parsePlanningThemeIdFromSearch, planningThemeHrefFromSearch } = await import(
      "@/lib/planning/planning-theme-filter-url"
    );
    const {
      parseProvenanceTableSearchQueryFromSearch,
      provenanceTableSearchHrefFromSearch,
      parseProvenanceTableNodeTypeFromSearch,
      provenanceTableNodeTypeHrefFromSearch,
    } = await import("@/lib/provenance/provenance-workspace-filters-url");

    expect(parsePatternLibraryTypeFromSearch("Security")).toBe("Security");
    expect(patternLibraryTypeHrefFromSearch("q=vpc", "Data")).toBe("/insights/patterns?q=vpc&type=Data");
    expect(parsePatternLibraryRiskFromSearch("High")).toBe("High");
    expect(patternLibraryRiskHrefFromSearch("domain=SaaS", "Moderate")).toBe(
      "/insights/patterns?domain=SaaS&risk=Moderate",
    );
    expect(parsePlanningThemeIdFromSearch("theme-1")).toBe("theme-1");
    expect(planningThemeHrefFromSearch("runId=r1", "theme-1")).toBe(
      "/insights/improvement-planning?runId=r1&theme=theme-1",
    );
    expect(parseProvenanceTableSearchQueryFromSearch("node-1")).toBe("node-1");
    expect(
      provenanceTableSearchHrefFromSearch("view=table", "evidence", "/architecture/reviews/r1/provenance"),
    ).toBe("/architecture/reviews/r1/provenance?view=table&q=evidence");
    expect(parseProvenanceTableNodeTypeFromSearch("Finding")).toBe("Finding");
    expect(
      provenanceTableNodeTypeHrefFromSearch("q=phi", "Decision", "/architecture/reviews/r1/provenance"),
    ).toBe("/architecture/reviews/r1/provenance?q=phi&nodeType=Decision");
  });

  it("graph node/decision id, cloud platform, and impact preview scope params", async () => {
    const { parseGraphNodeIdFromSearch, graphNodeIdHrefFromSearch, parseGraphDecisionIdFromSearch, graphDecisionIdHrefFromSearch } =
      await import("@/lib/insights/graph-node-decision-id-url");
    const { parseCloudConnectionsPlatformFromSearch, cloudConnectionsPlatformHrefFromSearch } = await import(
      "@/lib/integrations/cloud-connections-platform-url"
    );
    const {
      parseImpactPreviewComparisonScopeFromSearch,
      impactPreviewComparisonScopeHrefFromSearch,
      impactPreviewComparisonScopeToggleHrefFromSearch,
    } = await import("@/lib/impact-preview/impact-preview-comparison-scope-url");

    expect(parseGraphNodeIdFromSearch("node-42")).toBe("node-42");
    expect(graphNodeIdHrefFromSearch("runId=r1&graphMode=node-neighborhood", "node-42")).toBe(
      "/insights/evidence-graph?runId=r1&graphMode=node-neighborhood&nodeId=node-42",
    );
    expect(parseGraphDecisionIdFromSearch("claims.boundary")).toBe("claims.boundary");
    expect(graphDecisionIdHrefFromSearch("runId=r1", "claims.boundary")).toBe(
      "/insights/evidence-graph?runId=r1&decisionId=claims.boundary",
    );
    expect(parseCloudConnectionsPlatformFromSearch("aws")).toBe("aws");
    expect(cloudConnectionsPlatformHrefFromSearch("", "azure")).toBe("/integrations/cloud-connections?platform=azure");
    expect(parseImpactPreviewComparisonScopeFromSearch("findings,risk")).toEqual({
      findings: true,
      risk: true,
      cost: false,
      governance: false,
      evidence: false,
    });
    expect(impactPreviewComparisonScopeHrefFromSearch("", { findings: true, risk: true, cost: false, governance: false, evidence: false })).toBe(
      "/insights/impact-preview?scope=findings%2Crisk",
    );
    expect(
      impactPreviewComparisonScopeToggleHrefFromSearch(
        "scope=findings,risk",
        "cost",
        { findings: true, risk: true, cost: false, governance: false, evidence: false },
      ),
    ).toBe("/insights/impact-preview?scope=findings%2Crisk%2Ccost");
  });
});

describe("wave16 filter url helpers", () => {
  it("audit trail action, actor, and search params", async () => {
    const {
      parseAuditTrailActionFromSearch,
      auditTrailActionHrefFromSearch,
      parseAuditTrailActorFromSearch,
      auditTrailActorHrefFromSearch,
      parseAuditTrailSearchQueryFromSearch,
      auditTrailSearchHrefFromSearch,
    } = await import("@/lib/governance/audit-trail-filters-url");

    expect(parseAuditTrailActionFromSearch("ReviewCompleted")).toBe("ReviewCompleted");
    expect(auditTrailActionHrefFromSearch("range=24h", "ReviewCompleted")).toBe(
      "/governance/audit?range=24h&action=ReviewCompleted",
    );
    expect(parseAuditTrailActorFromSearch("architect@contoso.com")).toBe("architect@contoso.com");
    expect(auditTrailActorHrefFromSearch("action=ReviewCompleted", "architect@contoso.com")).toBe(
      "/governance/audit?action=ReviewCompleted&actor=architect%40contoso.com",
    );
    expect(parseAuditTrailSearchQueryFromSearch("correlation-1")).toBe("correlation-1");
    expect(auditTrailSearchHrefFromSearch("runId=r1", "phi")).toBe("/governance/audit?runId=r1&q=phi");
  });

  it("governance findings nl severity/status and assigned-to-me sort params", async () => {
    const {
      parseGovernanceFindingsNlSeverityFromSearch,
      governanceFindingsNlSeverityHrefFromSearch,
      parseGovernanceFindingsNlStatusFromSearch,
      governanceFindingsNlStatusHrefFromSearch,
    } = await import("@/lib/governance/governance-findings-queue-nl-facets-url");
    const {
      parseGovernanceAssignedToMeSortKeyFromSearch,
      governanceAssignedToMeSortHrefFromSearch,
    } = await import("@/lib/governance/governance-assigned-to-me-queue-sort-url");

    expect(parseGovernanceFindingsNlSeverityFromSearch("high")).toBe("high");
    expect(governanceFindingsNlSeverityHrefFromSearch("findingJobView=verify-hypotheses", "critical")).toBe(
      "/governance/findings?findingJobView=verify-hypotheses&severity=critical",
    );
    expect(parseGovernanceFindingsNlStatusFromSearch("open")).toBe("open");
    expect(governanceFindingsNlStatusHrefFromSearch("severity=high", "disposed")).toBe(
      "/governance/findings?severity=high&status=disposed",
    );
    expect(parseGovernanceAssignedToMeSortKeyFromSearch("due")).toBe("due");
    expect(governanceAssignedToMeSortHrefFromSearch("", "due", false)).toBe(
      "/governance/findings/assigned-to-me?sort=due&dir=desc",
    );
  });

  it("standards linked findings, decision confidence band, and provenance filters", async () => {
    const {
      parseStandardsRulesLinkedFindingsFromSearch,
      standardsRulesLinkedFindingsHrefFromSearch,
    } = await import("@/lib/governance/standards-rules-filters-url");
    const {
      parseDecisionRegisterMinConfidenceFromSearch,
      decisionRegisterMinConfidenceHrefFromSearch,
      decisionRegisterMaxConfidenceHrefFromSearch,
    } = await import("@/lib/governance/decision-register-confidence-band-url");
    const {
      parseProvenanceViewModeFromSearch,
      provenanceViewModeHrefFromSearch,
      parseProvenanceCategoryFromSearch,
      provenanceCategoryHrefFromSearch,
    } = await import("@/lib/provenance/provenance-workspace-filters-url");

    expect(parseStandardsRulesLinkedFindingsFromSearch("unlinked")).toBe("unlinked");
    expect(standardsRulesLinkedFindingsHrefFromSearch("q=vpc", "linked")).toBe(
      "/governance/standards-and-rules?q=vpc&linkedFindings=linked",
    );
    expect(parseDecisionRegisterMinConfidenceFromSearch("0.5")).toBe("0.5");
    expect(decisionRegisterMinConfidenceHrefFromSearch("category=Security", "0.75")).toBe(
      "/governance/decision-register?category=Security&minConfidence=0.75",
    );
    expect(decisionRegisterMaxConfidenceHrefFromSearch("minConfidence=0.5", "0.9")).toBe(
      "/governance/decision-register?minConfidence=0.5&maxConfidence=0.9",
    );
    expect(parseProvenanceViewModeFromSearch("table")).toBe("table");
    expect(provenanceViewModeHrefFromSearch("runId=r1", "timeline", "/architecture/reviews/r1/provenance")).toBe(
      "/architecture/reviews/r1/provenance?runId=r1&view=timeline",
    );
    expect(parseProvenanceCategoryFromSearch("findings")).toBe("findings");
    expect(provenanceCategoryHrefFromSearch("", "evidence", "/architecture/reviews/r1/provenance")).toBe(
      "/architecture/reviews/r1/provenance?category=evidence",
    );
  });

  it("sponsor roi range, graph depth, and help troubleshooting search params", async () => {
    const { parseSponsorRoiTrendRangeFromSearch, sponsorRoiTrendRangeHrefFromSearch } = await import(
      "@/lib/sponsor/sponsor-roi-trend-range-url"
    );
    const { parseGraphNeighborhoodDepthFromSearch, graphNeighborhoodDepthHrefFromSearch } = await import(
      "@/lib/insights/graph-neighborhood-depth-url"
    );
    const {
      parseHelpTroubleshootingSearchQuery,
      helpTroubleshootingSearchHrefFromSearch,
    } = await import("@/lib/help/help-troubleshooting-search-url");

    expect(parseSponsorRoiTrendRangeFromSearch("year")).toBe("year");
    expect(sponsorRoiTrendRangeHrefFromSearch("runId=r1", "30d")).toBe(
      "/architecture/sponsor-dashboard?runId=r1&range=30d",
    );
    expect(parseGraphNeighborhoodDepthFromSearch("3")).toBe(3);
    expect(graphNeighborhoodDepthHrefFromSearch("runId=r1&graphMode=node-neighborhood", 2)).toBe(
      "/insights/evidence-graph?runId=r1&graphMode=node-neighborhood&depth=2",
    );
    expect(parseHelpTroubleshootingSearchQuery("export failed")).toBe("export failed");
    expect(helpTroubleshootingSearchHrefFromSearch("", "workspace empty")).toBe(
      "/help/troubleshooting?q=workspace+empty",
    );
  });
});
