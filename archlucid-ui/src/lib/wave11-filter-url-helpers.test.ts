Warning: truncated output (original token count: 101199)
Total output lines: 7443

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

  it("policy findings group-by and audit date range params", async () => {
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
      standardsRulesResetFiltersHrefFromSearch,
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
    expect(
      standardsRulesResetFiltersHrefFromSearch(
        "runId=r1&q=encryption&severity=high&linkedFindings=linked&evidenceCoverage=evidenced&enforcement=Required&framework=NIST&pack=baseline&details=1",
      ),
    ).toBe("/governance/standards-and-rules?runId=r1&details=1");
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

describe("wave19 filter url helpers", () => {
  it("pattern governance/source, ai usage feature/groupBy, and findings hide generic", async () => {
    const {
      parsePatternLibraryGovernanceFromSearch,
      patternLibraryGovernanceHrefFromSearch,
      parsePatternLibraryDataSourceFromSearch,
      patternLibraryDataSourceHrefFromSearch,
    } = await import("@/lib/insights/pattern-library-filters-url");
    const { aiUsageFeatureHrefFromSearch, aiUsageGroupByHrefFromSearch } = await import(
      "@/lib/administration/ai-usage-dashboard-filter-url"
    );
    const {
      parseGovernanceFindingsHideGenericFromSearch,
      governanceFindingsHideGenericHrefFromSearch,
    } = await import("@/lib/governance/governance-findings-hide-generic-url");

    expect(parsePatternLibraryGovernanceFromSearch("Usually approved")).toBe("Usually approved");
    expect(patternLibraryGovernanceHrefFromSearch("q=vpc", "Needs evidence")).toBe(
      "/insights/patterns?q=vpc&governance=Needs+evidence",
    );
    expect(parsePatternLibraryDataSourceFromSearch("Sample data")).toBe("Sample data");
    expect(patternLibraryDataSourceHrefFromSearch("domain=SaaS", "Anonymized aggregate")).toBe(
      "/insights/patterns?domain=SaaS&source=Anonymized+aggregate",
    );
    expect(aiUsageFeatureHrefFromSearch("", "chat", "/administration/ai-usage")).toBe(
      "/administration/ai-usage?feature=chat",
    );
    expect(aiUsageGroupByHrefFromSearch("trigger=manual", "model", "/administration/ai-usage")).toBe(
      "/administration/ai-usage?trigger=manual&groupBy=model",
    );
    expect(parseGovernanceFindingsHideGenericFromSearch("1")).toBe(true);
    expect(governanceFindingsHideGenericHrefFromSearch("severity=critical", true)).toBe(
      "/governance/findings?severity=critical&hideGeneric=1",
    );
  });

  it("audit custom dates, operational errors, trial funnel, and impact preview selection", async () => {
    const {
      parseAuditTrailCustomDateFromSearch,
      auditTrailCustomDateHrefFromSearch,
    } = await import("@/lib/governance/audit-trail-custom-date-url");
    const { auditTrailDateRangePresetHrefFromSearch } = await import("@/lib/governance/audit-trail-date-range-url");
    const {
      parseOperationalErrorsCategoryFromSearch,
      operationalErrorsCategoryHrefFromSearch,
      parseOperationalErrorsStatusFromSearch,
      operationalErrorsStatusHrefFromSearch,
    } = await import("@/lib/internal/operational-errors-filter-url");
    const {
      parseTrialFunnelPeriodDaysFromSearch,
      trialFunnelPeriodHrefFromSearch,
      parseTrialFunnelStageFromSearch,
      trialFunnelStageHrefFromSearch,
    } = await import("@/lib/internal/trial-funnel-filter-url");
    const {
      parseImpactPreviewCandidateIdFromSearch,
      impactPreviewCandidateHrefFromSearch,
      parseImpactPreviewBaselineFromSearch,
      impactPreviewBaselineHrefFromSearch,
    } = await import("@/lib/impact-preview/impact-preview-selection-url");

    expect(parseAuditTrailCustomDateFromSearch("2026-04-10T08:30")).toBe("2026-04-10T08:30");
    expect(auditTrailCustomDateHrefFromSearch("action=Login", "2026-04-10T08:30", "2026-05-01T12:00")).toBe(
      "/governance/audit?action=Login&from=2026-04-10T08%3A30&to=2026-05-01T12%3A00",
    );
    expect(auditTrailDateRangePresetHrefFromSearch("from=2026-04-10T08:30", "24h")).toBe(
      "/governance/audit?range=24h",
    );
    expect(parseOperationalErrorsCategoryFromSearch("HttpError")).toBe("HttpError");
    expect(operationalErrorsCategoryHrefFromSearch("", "DatabaseError")).toBe(
      "/internal/operational-errors?category=DatabaseError",
    );
    expect(parseOperationalErrorsStatusFromSearch("500")).toBe("500");
    expect(operationalErrorsStatusHrefFromSearch("category=HttpError", "400")).toBe(
      "/internal/operational-errors?category=HttpError&status=400",
    );
    expect(parseTrialFunnelPeriodDaysFromSearch("90")).toBe(90);
    expect(trialFunnelPeriodHrefFromSearch("", 7)).toBe("/internal/trial-funnel?range=7");
    expect(parseTrialFunnelStageFromSearch("converted")).toBe("converted");
    expect(trialFunnelStageHrefFromSearch("range=90", "checkout-activity")).toBe(
      "/internal/trial-funnel?range=90&stage=checkout-activity",
    );
    expect(parseImpactPreviewCandidateIdFromSearch("cand-1")).toBe("cand-1");
    expect(impactPreviewCandidateHrefFromSearch("scope=findings", "cand-1")).toBe(
      "/insights/impact-preview?scope=findings&candidateId=cand-1",
    );
    expect(parseImpactPreviewBaselineFromSearch("run-baseline")).toBe("run-baseline");
    expect(impactPreviewBaselineHrefFromSearch("candidateId=cand-1", "run-baseline")).toBe(
      "/insights/impact-preview?candidateId=cand-1&baseline=run-baseline",
    );
  });

  it("sponsor report custom dates and findings NL title keywords", async () => {
    const {
      parseSponsorReportCustomDateFromSearch,
      sponsorReportCustomDateHrefFromSearch,
    } = await import("@/lib/insights/sponsor-report-custom-date-url");
    const { sponsorReportPeriodHrefFromSearch } = await import("@/lib/insights/sponsor-report-period-url");
    const {
      parseGovernanceFindingsNlTitleKeywordsFromSearch,
      governanceFindingsNlTitleHrefFromSearch,
      governanceFindingsNlFacetsHrefFromSearch,
    } = await import("@/lib/governance/governance-findings-queue-nl-facets-url");

    expect(parseSponsorReportCustomDateFromSearch("2026-03-01T00:00")).toBe("2026-03-01T00:00");
    expect(sponsorReportCustomDateHrefFromSearch("range=custom", "2026-03-01T00:00", "2026-04-01T00:00")).toBe(
      "/insights/sponsor-report?range=custom&from=2026-03-01T00%3A00&to=2026-04-01T00%3A00",
    );
    expect(sponsorReportPeriodHrefFromSearch("from=2026-03-01T00:00&to=2026-04-01T00:00", "last-90")).toBe(
      "/insights/sponsor-report?range=last-90",
    );
    expect(parseGovernanceFindingsNlTitleKeywordsFromSearch("tls endpoint")).toEqual(["tls", "endpoint"]);
    expect(governanceFindingsNlTitleHrefFromSearch("severity=high", ["tls", "endpoint"])).toBe(
      "/governance/findings?severity=high&title=tls+endpoint",
    );
    expect(
      governanceFindingsNlFacetsHrefFromSearch("q=queue", {
        severity: "critical",
        status: "open",
        titleKeywords: ["private"],
      }),
    ).toBe("/governance/findings?q=queue&severity=critical&status=open&title=private");
  });
});

describe("wave20 filter url helpers", () => {
  it("decision register custom dates, trial funnel attention/compare/sort, and operational errors text filters", async () => {
    const {
      parseDecisionRegisterCustomDateFromSearch,
      decisionRegisterCustomDateHrefFromSearch,
    } = await import("@/lib/governance/decision-register-custom-date-url");
    const {
      parseTrialFunnelAttentionOnlyFromSearch,
      trialFunnelAttentionHrefFromSearch,
      parseTrialFunnelComparePreviousFromSearch,
      trialFunnelCompareHrefFromSearch,
      parseTrialFunnelCohortSortKeyFromSearch,
      trialFunnelCohortSortHrefFromSearch,
    } = await import("@/lib/internal/trial-funnel-filter-url");
    const {
      parseOperationalErrorsTenantFromSearch,
      operationalErrorsTenantHrefFromSearch,
      parseOperationalErrorsCorrelationFromSearch,
      operationalErrorsCorrelationHrefFromSearch,
    } = await import("@/lib/internal/operational-errors-filter-url");

    expect(parseDecisionRegisterCustomDateFromSearch("2026-04-10")).toBe("2026-04-10");
    expect(decisionRegisterCustomDateHrefFromSearch("category=Security", "2026-04-10", "2026-05-01")).toBe(
      "/governance/decision-register?category=Security&from=2026-04-10&to=2026-05-01",
    );
    expect(parseTrialFunnelAttentionOnlyFromSearch("1")).toBe(true);
    expect(trialFunnelAttentionHrefFromSearch("range=30", true)).toBe("/internal/trial-funnel?range=30&attention=1");
    expect(parseTrialFunnelComparePreviousFromSearch("1")).toBe(true);
    expect(trialFunnelCompareHrefFromSearch("stage=converted", true)).toBe(
      "/internal/trial-funnel?stage=converted&compare=1",
    );
    expect(parseTrialFunnelCohortSortKeyFromSearch("organizationName")).toBe("organizationName");
    expect(trialFunnelCohortSortHrefFromSearch("", "organizationName", true)).toBe(
      "/internal/trial-funnel?sort=organizationName&dir=asc",
    );
    expect(parseOperationalErrorsTenantFromSearch("tenant-1")).toBe("tenant-1");
    expect(operationalErrorsTenantHrefFromSearch("category=HttpError", "tenant-1")).toBe(
      "/internal/operational-errors?category=HttpError&tenant=tenant-1",
    );
    expect(parseOperationalErrorsCorrelationFromSearch("corr-9")).toBe("corr-9");
    expect(operationalErrorsCorrelationHrefFromSearch("tenant=tenant-1", "corr-9")).toBe(
      "/internal/operational-errors?tenant=tenant-1&correlation=corr-9",
    );
  });

  it("platform policy packs, product learning range, findings visibility, and recommendation learning sort", async () => {
    const {
      parsePlatformBundledPolicyPacksSearchFromSearch,
      platformBundledPolicyPacksSearchHrefFromSearch,
      parsePlatformBundledPolicyPacksCategoryFromSearch,
      platformBundledPolicyPacksCategoryHrefFromSearch,
    } = await import("@/lib/internal/platform-bundled-policy-packs-filter-url");
    const { parseProductLearningRangeFromSearch, productLearningRangeHrefFromSearch } = await import(
      "@/lib/internal/product-learning-range-url"
    );
    const {
      parseReviewFindingsShowLowFromSearch,
      parseReviewFindingsShowAdvisoryFromSearch,
      parseReviewFindingsHideGenericFromSearch,
      reviewFindingsVisibilityHrefFromSearch,
    } = await import("@/lib/findings/review-findings-visibility-url");
    const {
      parseRecommendationLearningWeightSortKeyFromSearch,
      recommendationLearningWeightSortHrefFromSearch,
    } = await import("@/lib/internal/recommendation-learning-weight-sort-url");

    expect(parsePlatformBundledPolicyPacksSearchFromSearch("azure waf")).toBe("azure waf");
    expect(platformBundledPolicyPacksSearchHrefFromSearch("", "azure waf")).toBe(
      "/internal/platform-bundled-policy-packs?q=azure+waf",
    );
    expect(parsePlatformBundledPolicyPacksCategoryFromSearch("aws")).toBe("aws");
    expect(platformBundledPolicyPacksCategoryHrefFromSearch("q=waf", "aws")).toBe(
      "/internal/platform-bundled-policy-packs?q=waf&category=aws",
    );
    expect(parseProductLearningRangeFromSearch("7d")).toBe("7d");
    expect(productLearningRangeHrefFromSearch("", "30d")).toBe("/internal/product-learning?range=30d");
    expect(parseReviewFindingsShowLowFromSearch("1")).toBe(true);
    expect(parseReviewFindingsShowAdvisoryFromSearch("1")).toBe(true);
    expect(parseReviewFindingsHideGenericFromSearch("1")).toBe(true);
    expect(
      reviewFindingsVisibilityHrefFromSearch(
        "tab=findings",
        { showLowConfidence: true, showAdvisory: false, hideGenericLowDensity: true },
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?tab=findings&showLow=1&hideGeneric=1");
    expect(parseRecommendationLearningWeightSortKeyFromSearch("feature")).toBe("feature");
    expect(recommendationLearningWeightSortHrefFromSearch("", "feature", true)).toBe(
      "/internal/recommendation-learning?sort=feature&dir=asc",
    );
  });
});

describe("wave21 filter url helpers", () => {
  it("replay validation mode, comparison replay cost, and graph presentation params", async () => {
    const { parseReplayValidationModeFromSearch, replayValidationModeHrefFromSearch } = await import(
      "@/lib/replay/replay-validation-mode-url"
    );
    const {
      comparisonReplayCostHrefFromSearch,
      parseComparisonRecordIdFromSearch,
      parseComparisonReplayModeFromSearch,
      parseComparisonReplayPersistFromSearch,
      parseComparisonFormatFromSearch,
    } = await import("@/lib/compare/comparison-replay-cost-url");
    const { graphPresentationViewHrefFromSearch, parseGraphPresentationViewFromSearch } = await import(
      "@/lib/insights/graph-presentation-view-url"
    );

    expect(parseReplayValidationModeFromSearch("RebuildManifest")).toBe("RebuildManifest");
    expect(replayValidationModeHrefFromSearch("runId=r1", "RebuildArtifacts")).toBe(
      "/internal/validate-route?runId=r1&mode=RebuildArtifacts",
    );
    expect(parseComparisonRecordIdFromSearch("cmp-1")).toBe("cmp-1");
    expect(parseComparisonReplayModeFromSearch("ReconstructOnly")).toBe("ReconstructOnly");
    expect(parseComparisonReplayPersistFromSearch("1")).toBe(true);
    expect(parseComparisonFormatFromSearch("pdf")).toBe("pdf");
    expect(
      comparisonReplayCostHrefFromSearch("", {
        comparisonRecordId: "cmp-1",
        replayMode: "RebuildManifest",
        persistReplay: true,
        format: "pdf",
      }),
    ).toBe("/insights/compare-two-reviews?comparisonRecordId=cmp-1&replayMode=RebuildManifest&persist=1&comparisonFormat=pdf");
    expect(parseGraphPresentationViewFromSearch("trace")).toBe("trace");
    expect(graphPresentationViewHrefFromSearch("runId=r1", "graph")).toBe(
      "/insights/evidence-graph?runId=r1&presentation=graph",
    );
  });

  it("sealed records pagination/custom dates, alerts cursor, and integration dlq filters", async () => {
    const {
      parseSignedRecordsListCursorFromSearch,
      signedRecordsListCursorHrefFromSearch,
    } = await import("@/lib/signed-records/signed-records-list-pagination-url");
    const {
      parseSignedRecordsListCustomDateFromSearch,
      signedRecordsListCustomDateHrefFromSearch,
    } = await import("@/lib/signed-records/signed-records-list-custom-date-url");
    const { alertsInboxCursorHrefFromSearch, parseAlertsInboxCursorFromSearch } = await import(
      "@/lib/governance/alerts-inbox-cursor-url"
    );
    const {
      integrationEventsDlqEventTypeHrefFromSearch,
      integrationEventsDlqTenantHrefFromSearch,
      parseIntegrationEventsDlqEventTypeFromSearch,
      parseIntegrationEventsDlqTenantFromSearch,
    } = await import("@/lib/internal/integration-events-dlq-filter-url");

    expect(parseSignedRecordsListCursorFromSearch("cur-2")).toBe("cur-2");
    expect(signedRecordsListCursorHrefFromSearch("q=phi", "cur-2")).toBe(
      "/governance/sealed-records?q=phi&cursor=cur-2",
    );
    expect(parseSignedRecordsListCustomDateFromSearch("2026-04-10")).toBe("2026-04-10");
    expect(signedRecordsListCustomDateHrefFromSearch("range=7d", "2026-04-10", "2026-05-01")).toBe(
      "/governance/sealed-records?from=2026-04-10&to=2026-05-01",
    );
    expect(parseAlertsInboxCursorFromSearch("cur-alerts")).toBe("cur-alerts");
    expect(alertsInboxCursorHrefFromSearch("status=Open", "cur-alerts")).toBe(
      "/governance/alerts?status=Open&cursor=cur-alerts",
    );
    expect(parseIntegrationEventsDlqEventTypeFromSearch("ticketing")).toBe("ticketing");
    expect(integrationEventsDlqEventTypeHrefFromSearch("", "ticketing")).toBe(
      "/internal/failed-integration-messages?eventType=ticketing",
    );
    expect(parseIntegrationEventsDlqTenantFromSearch("tenant-1")).toBe("tenant-1");
    expect(integrationEventsDlqTenantHrefFromSearch("eventType=ticketing", "tenant-1")).toBe(
      "/internal/failed-integration-messages?eventType=ticketing&tenant=tenant-1",
    );
  });

  it("audit run id, advisory schedule panels, and recurrence schedule panels", async () => {
    const { auditTrailRunIdHrefFromSearch, parseAuditTrailRunIdFromSearch } = await import(
      "@/lib/governance/audit-trail-run-id-url"
    );
    const {
      advisorySchedulesPanelsHrefFromSearch,
      parseAdvisorySchedulesCreatePanelFromSearch,
      parseAdvisorySchedulesHistoryFromSearch,
    } = await import("@/lib/advisory/advisory-schedules-panels-url");
    const {
      parseRecurrenceSchedulesCreatePanelFromSearch,
      parseRecurrenceSchedulesEditIdFromSearch,
      recurrenceSchedulesPanelsHrefFromSearch,
    } = await import("@/lib/governance/recurrence-schedules-panels-url");

    expect(parseAuditTrailRunIdFromSearch("run-abc")).toBe("run-abc");
    expect(auditTrailRunIdHrefFromSearch("action=Create", "run-abc")).toBe(
      "/governance/audit?action=Create&runId=run-abc",
    );
    expect(parseAdvisorySchedulesCreatePanelFromSearch("1")).toBe(true);
    expect(parseAdvisorySchedulesHistoryFromSearch("sched-9")).toBe("sched-9");
    expect(advisorySchedulesPanelsHrefFromSearch("tab=schedules", { showCreatePanel: true })).toBe(
      "/governance/advisory-scans?tab=schedules&create=1",
    );
    expect(parseRecurrenceSchedulesCreatePanelFromSearch("1")).toBe(true);
    expect(parseRecurrenceSchedulesEditIdFromSearch("rec-3")).toBe("rec-3");
    expect(recurrenceSchedulesPanelsHrefFromSearch("", { editingId: "rec-3" })).toBe(
      "/governance/recurrence-schedules?edit=rec-3",
    );
  });
});

describe("wave22 filter url helpers", () => {
  it("policy packs tab, composite create panel, wizard mode, and specialty walkthrough selection", async () => {
    const { parsePolicyPacksTabFromSearch, policyPacksTabHrefFromSearch } = await import(
      "@/lib/policy/policy-packs-tab-url"
    );
    const {
      compositeAlertRulesPanelsHrefFromSearch,
      parseCompositeAlertRulesCreatePanelFromSearch,
    } = await import("@/lib/alerts/composite-alert-rules-panels-url");
    const { newRunWizardModeHrefFromSearch, parseNewRunWizardModeFromSearch } = await import(
      "@/lib/runs/new-run-wizard-mode-url"
    );
    const {
      parseSpecialtyWalkthroughCloudFromSearch,
      parseSpecialtyWalkthroughTemplateFromSearch,
      specialtyWalkthroughsSelectionHrefFromSearch,
    } = await import("@/lib/help/specialty-walkthroughs-selection-url");

    expect(parsePolicyPacksTabFromSearch("generator")).toBe("generator");
    expect(policyPacksTabHrefFromSearch("packId=p1", "catalog")).toBe(
      "/governance/policy-packs?packId=p1&tab=catalog",
    );
    expect(parseCompositeAlertRulesCreatePanelFromSearch("1")).toBe(true);
    expect(
      compositeAlertRulesPanelsHrefFromSearch("tab=advanced-rules", { showCreatePanel: true }),
    ).toBe("/governance/alert-rules?tab=advanced-rules&create=1");
    expect(parseNewRunWizardModeFromSearch("full")).toBe("full");
    expect(newRunWizardModeHrefFromSearch("", "full")).toBe("/architecture/reviews/new?mode=full");
    expect(parseSpecialtyWalkthroughTemplateFromSearch("saas-readiness")).toBe("saas-readiness");
    expect(parseSpecialtyWalkthroughCloudFromSearch("azure")).toBe("Azure");
    expect(
      specialtyWalkthroughsSelectionHrefFromSearch("", {
        templateId: "ai-governance",
        cloudContext: "Aws",
      }),
    ).toBe("/help/specialty-walkthroughs?template=ai-governance&cloud=aws");
  });

  it("audit cursor/disclosure, simulation mode, graph run id, generator template, and advisory scans filters", async () => {
    const { auditTrailCursorHrefFromSearch, parseAuditTrailCursorFromSearch } = await import(
      "@/lib/governance/audit-trail-cursor-url"
    );
    const {
      auditTrailFiltersDisclosureHrefFromSearch,
      parseAuditTrailAdvancedFiltersOpenFromSearch,
      parseAuditTrailPrimaryFiltersOpenFromSearch,
    } = await import("@/lib/governance/audit-trail-filters-disclosure-url");
    const { alertSimulationModeHrefFromSearch, parseAlertSimulationModeFromSearch } = await import(
      "@/lib/alerts/alert-simulation-mode-url"
    );
    const { graphRunIdHrefFromSearch, parseGraphRunIdFromSearch } = await import(
      "@/lib/insights/graph-run-id-url"
    );
    const {
      parsePolicyPackGeneratorTemplateFromSearch,
      policyPackGeneratorTemplateHrefFromSearch,
    } = await import("@/lib/policy/policy-pack-generator-template-url");
    const {
      advisoryScansFilterHrefFromSearch,
      parseAdvisoryScansCompareToFromSearch,
      parseAdvisoryScansSamplePreviewFromSearch,
    } = await import("@/lib/advisory/advisory-scans-filter-url");

    expect(parseAuditTrailCursorFromSearch("cur-audit")).toBe("cur-audit");
    expect(auditTrailCursorHrefFromSearch("action=Create", "cur-audit")).toBe(
      "/governance/audit?action=Create&cursor=cur-audit",
    );
    expect(parseAuditTrailAdvancedFiltersOpenFromSearch("1")).toBe(true);
    expect(parseAuditTrailPrimaryFiltersOpenFromSearch("1")).toBe(true);
    expect(
      auditTrailFiltersDisclosureHrefFromSearch("", {
        advancedAuditFiltersOpen: true,
        buyerPrimaryFiltersOpen: true,
      }),
    ).toBe("/governance/audit?advanced=1&primaryFilters=1");
    expect(parseAlertSimulationModeFromSearch("composite")).toBe("composite");
    expect(alertSimulationModeHrefFromSearch("tab=test-alerts", "compare")).toBe(
      "/governance/alert-rules?tab=test-alerts&simMode=compare",
    );
    expect(parseGraphRunIdFromSearch("run-graph")).toBe("run-graph");
    expect(graphRunIdHrefFromSearch("presentation=graph", "run-graph")).toBe(
      "/insights/evidence-graph?presentation=graph&runId=run-graph",
    );
    expect(parsePolicyPackGeneratorTemplateFromSearch("tpl-1")).toBe("tpl-1");
    expect(policyPackGeneratorTemplateHrefFromSearch("tab=generator", "tpl-1")).toBe(
      "/governance/policy-packs?tab=generator&generatorTemplate=tpl-1",
    );
    expect(parseAdvisoryScansCompareToFromSearch("run-baseline")).toBe("run-baseline");
    expect(parseAdvisoryScansSamplePreviewFromSearch("1")).toBe(true);
    expect(
      advisoryScansFilterHrefFromSearch("tab=scans&runId=r1", {
        compareToRunId: "run-baseline",
        showSamplePreview: true,
      }),
    ).toBe("/governance/advisory-scans?tab=scans&runId=r1&compareTo=run-baseline&sample=1");
  });
});

describe("wave23 filter url helpers", () => {
  it("new run wizard step, pilot toggles, and connector intake tab", async () => {
    const { newRunWizardStepHrefFromSearch, parseNewRunWizardStepFromSearch } = await import(
      "@/lib/runs/new-run-wizard-step-url"
    );
    const {
      newRunWizardPilotHrefFromSearch,
      parseNewRunWizardAdvancedConfigFromSearch,
      parseNewRunWizardPilotFromSearch,
    } = await import("@/lib/runs/new-run-wizard-pilot-url");
    const { connectorIntakeTabHrefFromSearch, parseConnectorIntakeTabFromSearch } = await import(
      "@/lib/runs/connector-intake-tab-url"
    );

    expect(parseNewRunWizardStepFromSearch("2")).toBe(2);
    expect(newRunWizardStepHrefFromSearch("mode=full", 2)).toBe("/architecture/reviews/new?mode=full&step=2");
    expect(parseNewRunWizardPilotFromSearch("0")).toBe(false);
    expect(parseNewRunWizardAdvancedConfigFromSearch("1")).toBe(true);
    expect(
      newRunWizardPilotHrefFromSearch("", { focusedPilotModeEnabled: false, advancedConfigurationOptIn: true }),
    ).toBe("/architecture/reviews/new?pilot=0&advancedConfig=1");
    expect(parseConnectorIntakeTabFromSearch("git")).toBe("git");
    expect(connectorIntakeTabHrefFromSearch("step=2", "git")).toBe("/architecture/reviews/new?step=2&intake=git");
  });

  it("advisory scans run id, schedule advanced, and digest subscription panels", async () => {
    const {
      advisoryScansFilterHrefFromSearch,
      parseAdvisoryScansRunIdFromSearch,
    } = await import("@/lib/advisory/advisory-scans-filter-url");
    const {
      advisorySchedulesPanelsHrefFromSearch,
      parseAdvisorySchedulesAdvancedOpenFromSearch,
    } = await import("@/lib/advisory/advisory-schedules-panels-url");
    const {
      digestSubscriptionsPanelsHrefFromSearch,
      parseDigestSubscriptionsCreatePanelFromSearch,
      parseDigestSubscriptionsHistoryFromSearch,
    } = await import("@/lib/digests/digest-subscriptions-panels-url");

    expect(parseAdvisoryScansRunIdFromSearch("run-scan")).toBe("run-scan");
    expect(advisoryScansFilterHrefFromSearch("tab=scans", { runId: "run-scan" })).toBe(
      "/governance/advisory-scans?tab=scans&runId=run-scan",
    );
    expect(parseAdvisorySchedulesAdvancedOpenFromSearch("1")).toBe(true);
    expect(advisorySchedulesPanelsHrefFromSearch("tab=schedules", { advancedOpen: true })).toBe(
      "/governance/advisory-scans?tab=schedules&advanced=1",
    );
    expect(parseDigestSubscriptionsCreatePanelFromSearch("1")).toBe(true);
    expect(parseDigestSubscriptionsHistoryFromSearch("sub-1")).toBe("sub-1");
    expect(
      digestSubscriptionsPanelsHrefFromSearch("tab=subscriptions", {
        showCreatePanel: true,
        historySubscriptionId: "sub-1",
      }),
    ).toBe("/architecture/digests?tab=subscriptions&create=1&history=sub-1");
  });

  it("digests browse preview collapse param", async () => {
    const { digestsBrowsePreviewHrefFromSearch, parseDigestsBrowsePreviewOpenFromSearch } = await import(
      "@/lib/digests/digests-browse-preview-url"
    );

    expect(parseDigestsBrowsePreviewOpenFromSearch("0")).toBe(false);
    expect(parseDigestsBrowsePreviewOpenFromSearch(null)).toBe(true);
    expect(digestsBrowsePreviewHrefFromSearch("tab=get-started", false)).toBe(
      "/architecture/digests?tab=get-started&preview=0",
    );
  });
});

describe("wave24 filter url helpers", () => {
  it("sso wizard step, tier2 connection step, and guided intake step", async () => {
    const { parseSsoWizardStepFromSearch, ssoWizardStepHrefFromSearch, SSO_WIZARD_PATH } = await import(
      "@/lib/administration/sso-wizard-step-url"
    );
    const { parseTier2ConnectionWizardStepFromSearch, tier2ConnectionWizardStepHrefFromSearch } = await import(
      "@/lib/integrations/tier2-connection-wizard-step-url"
    );
    const { parseGuidedIntakeStepFromSearch, guidedIntakeStepHrefFromSearch } = await import(
      "@/lib/runs/guided-intake-step-url"
    );

    expect(parseSsoWizardStepFromSearch("3")).toBe(3);
    expect(ssoWizardStepHrefFromSearch("", 2, SSO_WIZARD_PATH)).toBe(
      "/administration/identity/sso-wizard?step=2",
    );
    expect(parseTier2ConnectionWizardStepFromSearch("2")).toBe(2);
    expect(tier2ConnectionWizardStepHrefFromSearch("", 1, "/integrations/cloud-connections/azure")).toBe(
      "/integrations/cloud-connections/azure?step=1",
    );
    expect(parseGuidedIntakeStepFromSearch("1")).toBe(1);
    expect(guidedIntakeStepHrefFromSearch("path=guided-intake", 2)).toBe(
      "/architecture/reviews/new?path=guided-intake&intakeStep=2",
    );
  });

  it("policy pack selection, catalog entry, version compare, and authoring input mode", async () => {
    const { parsePolicyPackSelectionFromSearch, policyPackSelectionHrefFromSearch } = await import(
      "@/lib/policy/policy-pack-selection-url"
    );
    const { parsePolicyPackCatalogEntryFromSearch, policyPackCatalogEntryHrefFromSearch } = await import(
      "@/lib/policy/policy-pack-catalog-entry-url"
    );
    const {
      parsePolicyPackCompareVersionIdFromSearch,
      parsePolicyPackVersionDiffOpenFromSearch,
      policyPackVersionCompareHrefFromSearch,
    } = await import("@/lib/policy/policy-pack-version-compare-url");
    const { parsePolicyPackAuthoringInputModeFromSearch, policyPackAuthoringInputModeHrefFromSearch } =
      await import("@/lib/policy/policy-pack-authoring-input-mode-url");

    expect(parsePolicyPackSelectionFromSearch("pack-1")).toBe("pack-1");
    expect(policyPackSelectionHrefFromSearch("tab=my-packs", "pack-1")).toBe(
      "/governance/policy-packs?tab=my-packs&packId=pack-1",
    );
    expect(
      policyPackSelectionHrefFromSearch(
        "tab=my-packs&packId=p1&diff=1&compareLeft=left-1&compareRight=right-2",
        "pack-2",
      ),
    ).toBe("/governance/policy-packs?tab=my-packs&packId=pack-2");
    expect(parsePolicyPackCatalogEntryFromSearch("cat-9")).toBe("cat-9");
    expect(policyPackCatalogEntryHrefFromSearch("tab=catalog", "cat-9")).toBe(
      "/governance/policy-packs?tab=catalog&catalogEntry=cat-9",
    );
    expect(parsePolicyPackVersionDiffOpenFromSearch("1")).toBe(true);
    expect(parsePolicyPackCompareVersionIdFromSearch("left-1")).toBe("left-1");
    expect(
      policyPackVersionCompareHrefFromSearch("tab=my-packs&packId=p1", {
        showVersionDiff: true,
        compareLeftId: "left-1",
        compareRightId: "right-2",
      }),
    ).toBe("/governance/policy-packs?tab=my-packs&packId=p1&diff=1&compareLeft=left-1&compareRight=right-2");
    expect(parsePolicyPackAuthoringInputModeFromSearch("visual")).toBe("visual");
    expect(policyPackAuthoringInputModeHrefFromSearch("tab=author", "json")).toBe(
      "/governance/policy-packs?tab=author&inputMode=json",
    );
  });

  it("digests browse digest, graph load gate, and alert simulation scope", async () => {
    const { parseDigestsBrowseDigestIdFromSearch, digestsBrowseDigestHrefFromSearch } = await import(
      "@/lib/digests/digests-browse-digest-url"
    );
    const { parseGraphLoadRequestedFromSearch, graphLoadRequestedHrefFromSearch } = await import(
      "@/lib/insights/graph-load-requested-url"
    );
    const {
      alertSimulationScopeHrefFromSearch,
      parseAlertSimulationCompareRunIdFromSearch,
      parseAlertSimulationProjectSlugFromSearch,
      parseAlertSimulationRunIdFromSearch,
    } = await import("@/lib/alerts/alert-simulation-scope-url");

    expect(parseDigestsBrowseDigestIdFromSearch("digest-42")).toBe("digest-42");
    expect(digestsBrowseDigestHrefFromSearch("tab=get-started", "digest-42")).toBe(
      "/architecture/digests?tab=get-started&digest=digest-42",
    );
    expect(parseGraphLoadRequestedFromSearch("1")).toBe(true);
    expect(graphLoadRequestedHrefFromSearch("runId=r1", true)).toBe("/insights/evidence-graph?runId=r1&load=1");
    expect(parseAlertSimulationRunIdFromSearch("run-sim")).toBe("run-sim");
    expect(parseAlertSimulationCompareRunIdFromSearch("run-base")).toBe("run-base");
    expect(parseAlertSimulationProjectSlugFromSearch("vpc")).toBe("vpc");
    expect(
      alertSimulationScopeHrefFromSearch("tab=test-alerts&simMode=compare", {
        runId: "run-sim",
        compareRunId: "run-base",
        projectSlug: "vpc",
      }),
    ).toBe("/governance/alert-rules?tab=test-alerts&simMode=compare&simRunId=run-sim&simCompareRun=run-base&simSlug=vpc");
  });
});

describe("wave25 filter url helpers", () => {
  it("approval review, alert simulate rule, and settings users invite", async () => {
    const {
      governanceApprovalReviewHrefFromSearch,
      parseGovernanceApprovalIdFromSearch,
      parseGovernanceReviewModeFromSearch,
    } = await import("@/lib/governance/governance-approval-review-url");
    const { alertRulesSimulateRuleHrefFromSearch, parseAlertRulesSimulateRuleIdFromSearch } = await import(
      "@/lib/alerts/alert-rules-simulate-rule-url"
    );
    const { parseSettingsUsersInviteOpenFromSearch, settingsUsersInviteHrefFromSearch } = await import(
      "@/lib/administration/settings-users-invite-url"
    );

    expect(parseGovernanceApprovalIdFromSearch("req-1")).toBe("req-1");
    expect(parseGovernanceReviewModeFromSearch("approve")).toBe("approve");
    expect(
      governanceApprovalReviewHrefFromSearch("runId=r1", {
        approvalRequestId: "req-1",
        mode: "reject",
      }),
    ).toBe("/governance/approval-queue?runId=r1&approvalId=req-1&reviewMode=reject");
    expect(parseAlertRulesSimulateRuleIdFromSearch("rule-9")).toBe("rule-9");
    expect(alertRulesSimulateRuleHrefFromSearch("tab=rules", "rule-9")).toBe(
      "/governance/alert-rules?tab=rules&simulateRule=rule-9",
    );
    expect(parseSettingsUsersInviteOpenFromSearch("1")).toBe(true);
    expect(settingsUsersInviteHrefFromSearch("tab=users", true)).toBe("/administration/users?tab=users&invite=1");
  });

  it("sign-in step, itsm wizard step, and help panel overlay", async () => {
    const { parseSignInFlowStepFromSearch, signInFlowStepHrefFromSearch } = await import(
      "@/lib/auth/sign-in-flow-step-url"
    );
    const { itsmOnboardingWizardStepHrefFromSearch, parseItsmOnboardingWizardStepFromSearch } = await import(
      "@/lib/itsm/itsm-onboarding-wizard-step-url"
    );
    const {
      helpPanelOverlayHrefFromSearch,
      parseHelpPanelOpenFromSearch,
      parseHelpPanelQueryFromSearch,
      parseHelpPanelTabFromSearch,
    } = await import("@/lib/help/help-panel-overlay-url");

    expect(parseSignInFlowStepFromSearch("code")).toBe("code");
    expect(signInFlowStepHrefFromSearch("returnUrl=%2F", "email")).toBe("/auth/signin?returnUrl=%2F&step=email");
    expect(parseItsmOnboardingWizardStepFromSearch("verify")).toBe("verify");
    expect(itsmOnboardingWizardStepHrefFromSearch("", "runbooks")).toBe(
      "/internal/integrations/itsm?itsmStep=runbooks",
    );
    expect(parseHelpPanelOpenFromSearch("1")).toBe(true);
    expect(parseHelpPanelTabFromSearch("shortcuts")).toBe("shortcuts");
    expect(parseHelpPanelQueryFromSearch("vpc")).toBe("vpc");
    expect(
      helpPanelOverlayHrefFromSearch("runId=r1", { open: true, tab: "troubleshooting", query: "sso" }, "/governance/findings"),
    ).toBe("/governance/findings?runId=r1&help=1&helpTab=troubleshooting&helpQ=sso");
  });

  it("policy pack disclosures, saved view, ask thread, and graph node focus", async () => {
    const {
      parsePolicyPackAuthoringAdvancedOpenFromSearch,
      parsePolicyPackAuthoringToolsOpenFromSearch,
      policyPackAuthoringDisclosuresHrefFromSearch,
    } = await import("@/lib/policy/policy-pack-authoring-disclosures-url");
    const { operatorSavedViewHrefFromSearch, parseOperatorSavedViewIdFromSearch } = await import(
      "@/lib/operator/operator-saved-view-url"
    );
    const {
      askPageThreadHrefFromSearch,
      parseAskPageCompareOpenFromSearch,
      parseAskPageThreadIdFromSearch,
    } = await import("@/lib/ask/ask-page-thread-url");
    const { graphNodeFocusHrefFromSearch, parseGraphNodeFocusFromSearch } = await import(
      "@/lib/insights/graph-node-focus-url"
    );

    expect(parsePolicyPackAuthoringAdvancedOpenFromSearch("1")).toBe(true);
    expect(parsePolicyPackAuthoringToolsOpenFromSearch("true")).toBe(true);
    expect(
      policyPackAuthoringDisclosuresHrefFromSearch("tab=author", { advancedOpen: true, toolsOpen: true }),
    ).toBe("/governance/policy-packs?tab=author&advanced=1&tools=1");
    expect(parseOperatorSavedViewIdFromSearch("view-42")).toBe("view-42");
    expect(operatorSavedViewHrefFromSearch("q=phi", "view-42", "/governance/audit")).toBe(
      "/governance/audit?q=phi&viewId=view-42",
    );
    expect(parseAskPageThreadIdFromSearch("thread-1")).toBe("thread-1");
    expect(parseAskPageCompareOpenFromSearch("1")).toBe(true);
    expect(
      askPageThreadHrefFromSearch("runId=r1", { threadId: "thread-1", compareOpen: true }),
    ).toBe("/insights/ask-review-questions?runId=r1&thread=thread-1&compare=1");
    expect(parseGraphNodeFocusFromSearch("node-phi")).toBe("node-phi");
    expect(graphNodeFocusHrefFromSearch("runId=r1", "node-phi")).toBe(
      "/insights/evidence-graph?runId=r1&graphNodeId=node-phi",
    );
  });
});

describe("wave26 filter url helpers", () => {
  it("quick-family wizard step, evidence source, and extract-upload demo scenario", async () => {
    const { parseQuickFamilyWizardStepFromSearch, quickFamilyWizardStepHrefFromSearch } = await import(
      "@/lib/runs/quick-family-wizard-step-url"
    );
    const {
      parseWizardEvidenceDemoScenarioFromSearch,
      parseWizardEvidenceSourceFromSearch,
      wizardEvidenceSourceHrefFromSearch,
    } = await import("@/lib/runs/wizard-evidence-source-url");
    const { extractUploadDemoScenarioHrefFromSearch, parseExtractUploadDemoScenarioFromSearch } = await import(
      "@/lib/administration/extract-upload-demo-scenario-url"
    );

    expect(parseQuickFamilyWizardStepFromSearch("2")).toBe(2);
    expect(quickFamilyWizardStepHrefFromSearch("path=quick-start", 2)).toBe(
      "/architecture/reviews/new?path=quick-start&qsStep=2",
    );
    expect(parseWizardEvidenceSourceFromSearch("azure-export")).toBe("azure-export");
    expect(parseWizardEvidenceDemoScenarioFromSearch("customer-intake-modernization")).toBe(
      "customer-intake-modernization",
    );
    expect(
      wizardEvidenceSourceHrefFromSearch("", {
        evidenceSourceId: "azure-export",
        demoScenarioId: "customer-intake-modernization",
      }),
    ).toBe(
      "/architecture/reviews/new?evidenceSource=azure-export&demoScenario=customer-intake-modernization",
    );
    expect(
      wizardEvidenceSourceHrefFromSearch("", {
        evidenceSourceId: "azure-export",
        demoScenarioId: null,
      }),
    ).toBe("/architecture/reviews/new?evidenceSource=azure-export");
    expect(parseExtractUploadDemoScenarioFromSearch("customer-intake-modernization")).toBe(
      "customer-intake-modernization",
    );
    expect(extractUploadDemoScenarioHrefFromSearch("", "customer-intake-modernization")).toBe(
      "/administration/extract-upload?demoScenario=customer-intake-modernization",
    );
  });

  it("architecture intelligence tier, ask compare runs, and provenance node", async () => {
    const {
      architectureIntelligenceTierHrefFromSearch,
      parseArchitectureIntelligenceTierFromSearch,
    } = await import("@/lib/architecture/architecture-intelligence-tier-url");
    const {
      askPageThreadHrefFromSearch,
      parseAskPageBaseRunIdFromSearch,
      parseAskPageTargetRunIdFromSearch,
    } = await import("@/lib/ask/ask-page-thread-url");
    const { parseProvenanceSelectedNodeIdFromSearch, provenanceSelectedNodeHrefFromSearch } = await import(
      "@/lib/provenance/provenance-selected-node-url"
    );

    expect(parseArchitectureIntelligenceTierFromSearch("Deep")).toBe("Deep");
    expect(architectureIntelligenceTierHrefFromSearch("", "Deep")).toBe(
      "/architecture/architecture-intelligence?tier=Deep",
    );
    expect(architectureIntelligenceTierHrefFromSearch("tier=Deep", "Standard")).toBe(
      "/architecture/architecture-intelligence",
    );
    expect(parseAskPageBaseRunIdFromSearch("run-base")).toBe("run-base");
    expect(parseAskPageTargetRunIdFromSearch("run-target")).toBe("run-target");
    expect(
      askPageThreadHrefFromSearch("runId=r1", {
        threadId: "thread-1",
        compareOpen: true,
        baseRunId: "run-base",
        targetRunId: "run-target",
      }),
    ).toBe(
      "/insights/ask-review-questions?runId=r1&thread=thread-1&compare=1&baseRunId=run-base&targetRunId=run-target",
    );
    expect(parseProvenanceSelectedNodeIdFromSearch("node-9")).toBe("node-9");
    expect(
      provenanceSelectedNodeHrefFromSearch("runId=r1", "node-9", "/architecture/reviews/r1/provenance"),
    ).toBe("/architecture/reviews/r1/provenance?runId=r1&provNodeId=node-9");
  });

  it("diagram selection, findings dual-pane, what-if analysis, and graph edge focus", async () => {
    const {
      architectureDiagramSelectionHrefFromSearch,
      parseArchitectureDiagramEditOpenFromSearch,
      parseArchitectureDiagramIdFromSearch,
      parseArchitectureDiagramKindFromSearch,
    } = await import("@/lib/architecture/architecture-diagram-selection-url");
    const { architectureDiagramFindingHrefFromSearch, parseArchitectureDiagramFindingIdFromSearch } = await import(
      "@/lib/architecture/architecture-findings-dual-pane-url"
    );
    const {
      findingsWhatIfAnalysisHrefFromSearch,
      parseFindingsWhatIfEnabledFromSearch,
      parseFindingsWhatIfIdsFromSearch,
    } = await import("@/lib/findings/findings-what-if-analysis-url");
    const { graphEdgeFocusHrefFromSearch, parseGraphEdgeFocusFromSearch } = await import(
      "@/lib/insights/graph-edge-focus-url"
    );

    expect(parseArchitectureDiagramKindFromSearch("node")).toBe("node");
    expect(parseArchitectureDiagramIdFromSearch("diag-1")).toBe("diag-1");
    expect(parseArchitectureDiagramEditOpenFromSearch("1")).toBe(true);
    expect(
      architectureDiagramSelectionHrefFromSearch(
        "tab=architecture",
        { elementKind: "node", elementId: "diag-1", editorOpen: true },
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?tab=architecture&diagKind=node&diagId=diag-1&diagEdit=1");
    expect(parseArchitectureDiagramFindingIdFromSearch("finding-7")).toBe("finding-7");
    expect(
      architectureDiagramFindingHrefFromSearch("tab=architecture", "finding-7", "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?tab=architecture&findingId=finding-7");
    expect(parseFindingsWhatIfEnabledFromSearch("1")).toBe(true);
    expect(parseFindingsWhatIfIdsFromSearch("f1,f2")).toEqual(["f1", "f2"]);
    expect(
      findingsWhatIfAnalysisHrefFromSearch(
        "tab=findings",
        { enabled: true, findingIds: ["f1", "f2"] },
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?tab=findings&whatIf=1&whatIfIds=f1%2Cf2");
    expect(parseGraphEdgeFocusFromSearch("edge-3")).toBe("edge-3");
    expect(graphEdgeFocusHrefFromSearch("runId=r1", "edge-3")).toBe(
      "/insights/evidence-graph?runId=r1&graphEdgeId=edge-3",
    );
  });
});

describe("wave27 filter url helpers", () => {
  it("runs list compare/inspector, governance bulk selection, and risk exceptions renew/revoke", async () => {
    const {
      parseRunsListCompareRunIdsFromSearch,
      parseRunsListInspectorRunIdFromSearch,
      runsListCompareInspectorHrefFromSearch,
    } = await import("@/lib/runs/runs-list-compare-inspector-url");
    const {
      governanceFindingsBulkSelectionHrefFromSearch,
      parseGovernanceFindingsBulkSelectionFromSearch,
    } = await import("@/lib/governance/governance-findings-bulk-selection-url");
    const {
      parseRiskExceptionRenewIdFromSearch,
      parseRiskExceptionRevokeIdFromSearch,
      riskExceptionsRenewRevokeHrefFromSearch,
    } = await import("@/lib/governance/risk-exceptions-renew-revoke-url");

    expect(parseRunsListInspectorRunIdFromSearch("run-a")).toBe("run-a");
    expect(parseRunsListCompareRunIdsFromSearch("run-a,run-b")).toEqual(["run-a", "run-b"]);
    expect(
      runsListCompareInspectorHrefFromSearch("q=phi", {
        inspectorRunId: "run-a",
        compareRunIds: ["run-b"],
      }),
    ).toBe("/architecture/reviews?q=phi&inspectorRunId=run-a&compareRuns=run-b");
    expect(parseGovernanceFindingsBulkSelectionFromSearch("f1,f2")).toEqual(["f1", "f2"]);
    expect(governanceFindingsBulkSelectionHrefFromSearch("severity=high", ["f1"])).toBe(
      "/governance/findings?severity=high&bulkFindings=f1",
    );
    expect(parseRiskExceptionRenewIdFromSearch("exc-1")).toBe("exc-1");
    expect(parseRiskExceptionRevokeIdFromSearch("exc-2")).toBe("exc-2");
    expect(
      riskExceptionsRenewRevokeHrefFromSearch("", { renewId: "exc-1", revokeId: "exc-2" }),
    ).toBe("/governance/exceptions?renewId=exc-1&revokeId=exc-2");
  });

  it("alert tuning draft, finding inspect governance panel, and provenance edge focus", async () => {
    const {
      alertTuningFormDraftHrefFromSearch,
      parseAlertTuningKindFromSearch,
      parseAlertTuningRunSlugFromSearch,
      parseAlertTuningThresholdsFromSearch,
    } = await import("@/lib/alerts/alert-tuning-form-draft-url");
    const {
      findingInspectGovernancePanelHrefFromSearch,
      parseFindingInspectGovernancePanelFromSearch,
      parseFindingInspectWaiverConfirmOpenFromSearch,
    } = await import("@/lib/findings/finding-inspect-governance-panel-url");
    const {
      parseProvenanceEdgeFocusFromSearch,
      parseProvenanceEdgesExpandedFromSearch,
      provenanceEdgeFocusHrefFromSearch,
    } = await import("@/lib/provenance/provenance-edge-focus-url");

    expect(parseAlertTuningKindFromSearch("Composite")).toBe("Composite");
    expect(parseAlertTuningThresholdsFromSearch("0.8,0.9")).toBe("0.8,0.9");
    expect(parseAlertTuningRunSlugFromSearch("run-slug")).toBe("run-slug");
    expect(
      alertTuningFormDraftHrefFromSearch("tab=test-alerts", {
        ruleKind: "Simple",
        candidateThresholds: "0.5",
        runSlug: "run-slug",
      }),
    ).toBe("/governance/alert-rules?tab=test-alerts&tuneKind=Simple&tuneThresholds=0.5&tuneRunSlug=run-slug");
    expect(parseFindingInspectGovernancePanelFromSearch("waiver")).toBe("waiver");
    expect(parseFindingInspectWaiverConfirmOpenFromSearch("1")).toBe(true);
    expect(
      findingInspectGovernancePanelHrefFromSearch(
        "",
        { panel: "remediation", waiverConfirmOpen: true, waiverRevokeConfirmOpen: false },
        "/architecture/reviews/r1/findings/f1/inspect",
      ),
    ).toBe("/architecture/reviews/r1/findings/f1/inspect?govPanel=remediation&waiverConfirm=1");
    expect(parseProvenanceEdgeFocusFromSearch("edge-1")).toBe("edge-1");
    expect(parseProvenanceEdgesExpandedFromSearch("true")).toBe(true);
    expect(
      provenanceEdgeFocusHrefFromSearch(
        "runId=r1",
        { edgeId: "edge-1", edgesExpanded: true },
        "/architecture/reviews/r1/provenance",
      ),
    ).toBe("/architecture/reviews/r1/provenance?runId=r1&provEdgeId=edge-1&edgesExpanded=1");
  });

  it("architecture intelligence context run, first review guide step, account security, and presenter mode", async () => {
    const {
      architectureIntelligenceContextRunHrefFromSearch,
      parseArchitectureIntelligenceContextRunIdFromSearch,
    } = await import("@/lib/architecture/architecture-intelligence-context-run-url");
    const {
      firstReviewGuideWalkthroughStepHrefFromSearch,
      parseFirstReviewGuideWalkthroughStepFromSearch,
    } = await import("@/lib/first-review-guide/first-review-guide-walkthrough-step-url");
    const {
      accountSecurityStepHrefFromSearch,
      parseAccountSecurityChallengeIdFromSearch,
      parseAccountSecurityStepFromSearch,
    } = await import("@/lib/account/account-security-step-url");
    const { parseReviewPresenterModeFromSearch, reviewPresenterModeHrefFromSearch } = await import(
      "@/lib/reviews/review-presenter-mode-url"
    );

    expect(parseArchitectureIntelligenceContextRunIdFromSearch("run-ctx")).toBe("run-ctx");
    expect(architectureIntelligenceContextRunHrefFromSearch("tier=Deep", "run-ctx")).toBe(
      "/architecture/architecture-intelligence?tier=Deep&contextRunId=run-ctx",
    );
    expect(parseFirstReviewGuideWalkthroughStepFromSearch("3")).toBe(3);
    expect(firstReviewGuideWalkthroughStepHrefFromSearch("", 3)).toBe(
      "/architecture/first-review-guide?guideStep=3",
    );
    expect(firstReviewGuideWalkthroughStepHrefFromSearch("guideStep=3", 1)).toBe(
      "/architecture/first-review-guide",
    );
    expect(parseAccountSecurityStepFromSearch("verify")).toBe("verify");
    expect(parseAccountSecurityChallengeIdFromSearch("challenge-1")).toBe("challenge-1");
    expect(
      accountSecurityStepHrefFromSearch("", { step: "verify", challengeId: "challenge-1" }),
    ).toBe("/account/security?secStep=verify&challengeId=challenge-1");
    expect(parseReviewPresenterModeFromSearch("1")).toBe(true);
    expect(
      reviewPresenterModeHrefFromSearch("reviewTab=findings", true, "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?reviewTab=findings&presenter=1");
    expect(
      reviewPresenterModeHrefFromSearch("reviewTab=findings&presenter=1", false, "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?reviewTab=findings");
  });
});

describe("wave28 filter url helpers", () => {
  it("alerts inbox bulk, action loop, and pending action params", async () => {
    const {
      alertsInboxBatchSelectionHrefFromSearch,
      parseAlertsInboxActionAlertIdFromSearch,
      parseAlertsInboxActionKindFromSearch,
      parseAlertsInboxActionLoopIdFromSearch,
      parseAlertsInboxBulkSelectionFromSearch,
    } = await import("@/lib/alerts/alerts-inbox-batch-selection-url");

    expect(parseAlertsInboxBulkSelectionFromSearch("a1,a2")).toEqual(["a1", "a2"]);
    expect(parseAlertsInboxActionLoopIdFromSearch("alert-1")).toBe("alert-1");
    expect(parseAlertsInboxActionAlertIdFromSearch("alert-2")).toBe("alert-2");
    expect(parseAlertsInboxActionKindFromSearch("Acknowledge")).toBe("Acknowledge");
    expect(
      alertsInboxBatchSelectionHrefFromSearch(
        "status=open",
        {
          bulkAlertIds: ["a1"],
          actionLoopAlertId: "alert-1",
          pendingActionAlertId: "alert-2",
          pendingActionKind: "Resolve",
        },
      ),
    ).toBe(
      "/governance/alerts?status=open&bulkAlerts=a1&alertLoopId=alert-1&alertActionId=alert-2&alertAction=Resolve",
    );
  });

  it("disposition confirm, ask dock, and finding evidence graph view params", async () => {
    const {
      findingInspectDispositionConfirmHrefFromSearch,
      parseFindingInspectDispositionConfirmFromSearch,
    } = await import("@/lib/findings/finding-inspect-disposition-confirm-url");
    const {
      parseReviewAskDockOpenFromSearch,
      parseReviewAskDockThreadIdFromSearch,
      reviewAskDockHrefFromSearch,
    } = await import("@/lib/reviews/review-ask-dock-url");
    const {
      findingEvidenceGraphViewHrefFromSearch,
      parseFindingEvidenceGraphPresentationFromSearch,
      parseFindingEvidenceGraphViewFromSearch,
    } = await import("@/lib/findings/finding-evidence-graph-view-url");

    expect(parseFindingInspectDispositionConfirmFromSearch("mark-remediated")).toBe("mark-remediated");
    expect(
      findingInspectDispositionConfirmHrefFromSearch("govPanel=disposition", "disposition", "/inspect"),
    ).toBe("/inspect?govPanel=disposition&dispConfirm=disposition");
    expect(parseReviewAskDockOpenFromSearch("1")).toBe(true);
    expect(parseReviewAskDockThreadIdFromSearch("thread-1")).toBe("thread-1");
    expect(
      reviewAskDockHrefFromSearch("reviewTab=findings", { open: true, threadId: "thread-1" }, "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?reviewTab=findings&askDock=1&askThread=thread-1");
    expect(parseFindingEvidenceGraphViewFromSearch("reasoningPath")).toBe("reasoningPath");
    expect(parseFindingEvidenceGraphPresentationFromSearch("outline")).toBe("outline");
    expect(
      findingEvidenceGraphViewHrefFromSearch(
        "",
        { viewMode: "reasoningPath", presentationMode: "outline" },
        "/architecture/reviews/r1/findings/f1/inspect",
      ),
    ).toBe("/architecture/reviews/r1/findings/f1/inspect?evGraphView=reasoningPath&evPresentation=outline");
  });

  it("technology baseline, gcp wizard, explainability, ledger, scope gate, and email preview", async () => {
    const {
      parseTechnologyBaselineEntryIdFromSearch,
      technologyBaselineRationaleHrefFromSearch,
    } = await import("@/lib/reviews/technology-baseline-rationale-url");
    const { gcpConnectionWizardStepHrefFromSearch, parseGcpConnectionWizardStepFromSearch } = await import(
      "@/lib/integrations/gcp-connection-wizard-step-url"
    );
    const {
      parseRunFindingsExplainIdFromSearch,
      parseRunFindingsReasonIdFromSearch,
      runFindingsExplainabilityHrefFromSearch,
    } = await import("@/lib/runs/run-findings-explainability-url");
    const {
      firstReviewGuideLedgerHrefFromSearch,
      parseFirstReviewGuideLedgerExpandedFromSearch,
    } = await import("@/lib/first-review-guide/first-review-guide-ledger-url");
    const { parseScopeGateOpenFromSearch, scopeGateHrefFromSearch } = await import("@/lib/architecture/scope-gate-url");
    const {
      parseSponsorReportEmailPreviewOpenFromSearch,
      sponsorReportEmailPreviewHrefFromSearch,
    } = await import("@/lib/insights/sponsor-report-email-preview-url");

    expect(parseTechnologyBaselineEntryIdFromSearch("entry-1")).toBe("entry-1");
    expect(
      technologyBaselineRationaleHrefFromSearch("reviewTab=architecture", "entry-1", "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?reviewTab=architecture&techEntryId=entry-1");
    expect(parseGcpConnectionWizardStepFromSearch("1")).toBe(1);
    expect(gcpConnectionWizardStepHrefFromSearch("", 1)).toBe(
      "/integrations/cloud-connections/gcp?gcpStep=1",
    );
    expect(parseRunFindingsExplainIdFromSearch("finding-1")).toBe("finding-1");
    expect(parseRunFindingsReasonIdFromSearch("finding-2")).toBe("finding-2");
    expect(
      runFindingsExplainabilityHrefFromSearch(
        "reviewTab=findings",
        { explainFindingId: "finding-1", reasoningFindingId: "finding-2" },
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?reviewTab=findings&explainId=finding-1&reasonId=finding-2");
    expect(parseFirstReviewGuideLedgerExpandedFromSearch("1")).toBe(true);
    expect(firstReviewGuideLedgerHrefFromSearch("guideStep=3", true)).toBe(
      "/architecture/first-review-guide?guideStep=3&ledger=1",
    );
    expect(parseScopeGateOpenFromSearch("true")).toBe(true);
    expect(scopeGateHrefFromSearch("", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?scopeGate=1",
    );
    expect(parseSponsorReportEmailPreviewOpenFromSearch("1")).toBe(true);
    expect(sponsorReportEmailPreviewHrefFromSearch("range=30d", true)).toBe(
      "/insights/sponsor-report?range=30d&emailPreview=1",
    );
  });
});

describe("wave29 filter url helpers", () => {
  it("auth domains, operational errors, alert routing disable, and pilot wizards", async () => {
    const {
      authDomainsSelectionConfirmHrefFromSearch,
      parseAuthConfirmKindFromSearch,
      parseAuthDomainFromSearch,
    } = await import("@/lib/administration/auth-domains-selection-confirm-url");
    const {
      operationalErrorsDetailHrefFromSearch,
      parseOperationalErrorsDetailIdFromSearch,
    } = await import("@/lib/internal/operational-errors-detail-url");
    const {
      alertRoutingDisableRouteHrefFromSearch,
      parseAlertRoutingDisableRouteIdFromSearch,
    } = await import("@/lib/alerts/alert-routing-disable-route-url");
    const {
      parsePilotRoiWizardOpenFromSearch,
      parsePilotRoiWizardStepFromSearch,
      pilotRoiBaselineWizardHrefFromSearch,
    } = await import("@/lib/operator/pilot-roi-baseline-wizard-url");
    const {
      corePilotWizardHrefFromSearch,
      parseCorePilotWizardOpenFromSearch,
      parseCorePilotWizardStepFromSearch,
    } = await import("@/lib/operator/core-pilot-wizard-url");

    expect(parseAuthDomainFromSearch("example.com")).toBe("example.com");
    expect(parseAuthConfirmKindFromSearch("enable-enforcement")).toBe("enable-enforcement");
    expect(
      authDomainsSelectionConfirmHrefFromSearch(
        "",
        {
          selectedDomain: "example.com",
          confirmKind: "set-enforcement-mode",
          enforcementMode: "SsoRequired",
          allowEmailOtpRecovery: true,
          recoveryAdminEmail: null,
        },
      ),
    ).toBe(
      "/administration/auth-domains?authDomain=example.com&authConfirm=set-enforcement-mode&authEnforcementMode=SsoRequired&authOtpRecovery=1",
    );
    expect(parseOperationalErrorsDetailIdFromSearch("err-1")).toBe("err-1");
    expect(operationalErrorsDetailHrefFromSearch("category=HttpError", "err-1")).toBe(
      "/internal/operational-errors?category=HttpError&errorId=err-1",
    );
    expect(parseAlertRoutingDisableRouteIdFromSearch("route-1")).toBe("route-1");
    expect(
      alertRoutingDisableRouteHrefFromSearch("tab=notifications", "route-1"),
    ).toBe("/governance/alert-rules?tab=notifications&disableRouteId=route-1");
    expect(parsePilotRoiWizardOpenFromSearch("1")).toBe(true);
    expect(parsePilotRoiWizardStepFromSearch("1")).toBe(1);
    expect(pilotRoiBaselineWizardHrefFromSearch("", { open: true, stepIndex: 1 }, "/")).toBe("/?roiWizard=1&roiStep=1");
    expect(parseCorePilotWizardOpenFromSearch("true")).toBe(true);
    expect(parseCorePilotWizardStepFromSearch("2")).toBe(2);
    expect(corePilotWizardHrefFromSearch("help=1", { open: true, stepIndex: 2 }, "/home")).toBe(
      "/home?help=1&pilotWizard=1&pilotWizardStep=2",
    );
  });

  it("admin tenants, recycle bin, scim, account security, and governance promote/activate", async () => {
    const {
      adminTenantsActionHrefFromSearch,
      parseAdminTenantActionFromSearch,
      parseAdminTenantIdFromSearch,
    } = await import("@/lib/internal/admin-tenants-action-url");
    const {
      parseProjectsRecycleBinRestoreProjectIdFromSearch,
      projectsRecycleBinRestoreHrefFromSearch,
    } = await import("@/lib/administration/projects-recycle-bin-restore-url");
    const {
      parseScimTokenCreateOpenFromSearch,
      parseScimTokenRevokeIdFromSearch,
      scimProvisioningTokenHrefFromSearch,
    } = await import("@/lib/administration/scim-provisioning-token-url");
    const {
      accountSecurityRemoveLinkHrefFromSearch,
      parseAccountSecurityLinkProposalFromSearch,
      parseAccountSecurityRemoveMethodFromSearch,
    } = await import("@/lib/account/account-security-remove-link-url");
    const {
      governanceApprovalPromoteActivateHrefFromSearch,
      parseGovernanceActivateIdFromSearch,
      parseGovernancePromoteEnvFromSearch,
      parseGovernancePromoteManifestFromSearch,
    } = await import("@/lib/governance/governance-approval-promote-activate-url");

    expect(parseAdminTenantIdFromSearch("tenant-1")).toBe("tenant-1");
    expect(parseAdminTenantActionFromSearch("shut-off")).toBe("shut-off");
    expect(
      adminTenantsActionHrefFromSearch("", { tenantId: "tenant-1", action: "turn-on" }),
    ).toBe("/internal/tenants?tenantId=tenant-1&tenantAction=turn-on");
    expect(parseProjectsRecycleBinRestoreProjectIdFromSearch("project-1")).toBe("project-1");
    expect(projectsRecycleBinRestoreHrefFromSearch("", "project-1")).toBe(
      "/administration/workspace-settings/recycle-bin?restoreProject=project-1",
    );
    expect(parseScimTokenCreateOpenFromSearch("1")).toBe(true);
    expect(parseScimTokenRevokeIdFromSearch("token-1")).toBe("token-1");
    expect(
      scimProvisioningTokenHrefFromSearch("", { createOpen: true, revokeTokenId: "token-1" }),
    ).toBe("/administration/scim-provisioning?scimCreate=1&scimRevokeId=token-1");
    expect(parseAccountSecurityRemoveMethodFromSearch("identity-1")).toBe("identity-1");
    expect(parseAccountSecurityLinkProposalFromSearch("proposal-1")).toBe("proposal-1");
    expect(
      accountSecurityRemoveLinkHrefFromSearch(
        "secStep=verify",
        { removeMethodIdentityId: "identity-1", linkProposalId: "proposal-1" },
      ),
    ).toBe("/account/security?secStep=verify&removeMethod=identity-1&linkProposal=proposal-1");
    expect(parseGovernancePromoteManifestFromSearch("manifest-1")).toBe("manifest-1");
    expect(parseGovernancePromoteEnvFromSearch("prod")).toBe("prod");
    expect(parseGovernanceActivateIdFromSearch("activation-1")).toBe("activation-1");
    expect(
      governanceApprovalPromoteActivateHrefFromSearch(
        "approvalId=a1&reviewMode=approve",
        {
          promoteManifestId: "manifest-1",
          promoteTargetEnv: "prod",
          activateId: "activation-1",
        },
      ),
    ).toBe(
      "/governance/approval-queue?approvalId=a1&reviewMode=approve&promoteManifest=manifest-1&promoteEnv=prod&activateId=activation-1",
    );
  });

  it("architecture linked view and finalize confirm/success params", async () => {
    const {
      architectureFindingsLinkedViewHrefFromSearch,
      parseArchitectureFindingsLinkedViewFromSearch,
    } = await import("@/lib/architecture/architecture-findings-linked-view-url");
    const {
      parseReviewFinalizeConfirmOpenFromSearch,
      parseReviewFinalizeSuccessOpenFromSearch,
      reviewFinalizeConfirmHrefFromSearch,
    } = await import("@/lib/reviews/review-finalize-confirm-url");

    expect(parseArchitectureFindingsLinkedViewFromSearch("1")).toBe(true);
    expect(
      architectureFindingsLinkedViewHrefFromSearch("reviewTab=diagram", true, "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?reviewTab=diagram&linkedView=1");
    expect(parseReviewFinalizeConfirmOpenFromSearch("true")).toBe(true);
    expect(parseReviewFinalizeSuccessOpenFromSearch("1")).toBe(true);
    expect(
      reviewFinalizeConfirmHrefFromSearch(
        "reviewTab=overview",
        { confirmOpen: true, successOpen: false },
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?reviewTab=overview&finalizeConfirm=1");
    expect(
      reviewFinalizeConfirmHrefFromSearch(
        "finalizeConfirm=1",
        { confirmOpen: false, successOpen: true },
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?finalizeSuccess=1");
  });
});

describe("wave30 filter url helpers", () => {
  it("aws wizard, cloud disconnect, webhooks toggle, and review archive", async () => {
    const {
      awsConnectionWizardStepHrefFromSearch,
      parseAwsConnectionWizardStepFromSearch,
    } = await import("@/lib/integrations/aws-connection-wizard-step-url");
    const {
      cloudConnectionDisconnectHrefFromSearch,
      parseCloudConnectionDisconnectIdFromSearch,
    } = await import("@/lib/integrations/cloud-connection-disconnect-url");
    const {
      parseWebhookDisableIdFromSearch,
      parseWebhookEnableIdFromSearch,
      webhooksToggleConfirmHrefFromSearch,
    } = await import("@/lib/integrations/webhooks-toggle-confirm-url");
    const {
      parseReviewArchiveConfirmOpenFromSearch,
      parseReviewArchiveRunIdFromSearch,
      reviewArchiveConfirmHrefFromSearch,
    } = await import("@/lib/reviews/review-archive-confirm-url");

    expect(parseAwsConnectionWizardStepFromSearch("1")).toBe(1);
    expect(awsConnectionWizardStepHrefFromSearch("", 1)).toBe(
      "/integrations/cloud-connections/aws?awsStep=1",
    );
    expect(parseCloudConnectionDisconnectIdFromSearch("conn-1")).toBe("conn-1");
    expect(
      cloudConnectionDisconnectHrefFromSearch("", "conn-1", "/integrations/cloud-connections/aws"),
    ).toBe("/integrations/cloud-connections/aws?disconnectId=conn-1");
    expect(parseWebhookDisableIdFromSearch("sub-1")).toBe("sub-1");
    expect(parseWebhookEnableIdFromSearch("sub-2")).toBe("sub-2");
    expect(
      webhooksToggleConfirmHrefFromSearch("", {
        disableRoutingSubscriptionId: "sub-1",
        enableRoutingSubscriptionId: null,
      }),
    ).toBe("/integrations/webhooks?webhookDisableId=sub-1");
    expect(
      webhooksToggleConfirmHrefFromSearch("", {
        disableRoutingSubscriptionId: null,
        enableRoutingSubscriptionId: "sub-2",
      }),
    ).toBe("/integrations/webhooks?webhookEnableId=sub-2");
    expect(parseReviewArchiveRunIdFromSearch("run-1")).toBe("run-1");
    expect(parseReviewArchiveConfirmOpenFromSearch("1")).toBe(true);
    expect(
      reviewArchiveConfirmHrefFromSearch("", { runId: "run-1", confirmOpen: true }),
    ).toBe("/architecture/reviews?archiveRunId=run-1&archiveConfirm=1");
  });

  it("draft delete, api keys, billing checkout, digest pause, recurrence disable, cluster disposition", async () => {
    const {
      architectureDraftDeleteConfirmHrefFromSearch,
      parseArchitectureDraftDeleteConfirmOpenFromSearch,
      parseArchitectureDraftDeleteIdFromSearch,
    } = await import("@/lib/architecture/architecture-draft-delete-confirm-url");
    const {
      apiKeyActionConfirmHrefFromSearch,
      parseApiKeyActionFromSearch,
    } = await import("@/lib/administration/api-key-action-confirm-url");
    const {
      billingCheckoutConfirmHrefFromSearch,
      parseBillingCheckoutConfirmOpenFromSearch,
    } = await import("@/lib/administration/billing-checkout-confirm-url");
    const {
      digestSubscriptionsPanelsHrefFromSearch,
      parseDigestSubscriptionsPauseIdFromSearch,
    } = await import("@/lib/digests/digest-subscriptions-panels-url");
    const {
      parseRecurrenceSchedulesDisableIdFromSearch,
      recurrenceSchedulesPanelsHrefFromSearch,
    } = await import("@/lib/governance/recurrence-schedules-panels-url");
    const {
      parseRootCauseClusterDispFromSearch,
      parseRootCauseClusterKeyFromSearch,
      rootCauseClusterDispositionHrefFromSearch,
      rootCauseClusterDispositionToUrlValue,
    } = await import("@/lib/findings/root-cause-cluster-disposition-url");

    expect(parseArchitectureDraftDeleteIdFromSearch("draft-1")).toBe("draft-1");
    expect(parseArchitectureDraftDeleteConfirmOpenFromSearch("true")).toBe(true);
    expect(
      architectureDraftDeleteConfirmHrefFromSearch(
        "",
        { draftId: "draft-1", confirmOpen: true },
      ),
    ).toBe("/architecture/architectures?draftDeleteId=draft-1&draftDeleteConfirm=1");
    expect(parseApiKeyActionFromSearch("rotate_admin")).toBe("rotate_admin");
    expect(apiKeyActionConfirmHrefFromSearch("", "issue_overlap")).toBe(
      "/administration/api-keys?apiKeyAction=issue_overlap",
    );
    expect(parseBillingCheckoutConfirmOpenFromSearch("1")).toBe(true);
    expect(billingCheckoutConfirmHrefFromSearch("plan=architect", true)).toBe(
      "/administration/billing?plan=architect&checkoutConfirm=1",
    );
    expect(parseDigestSubscriptionsPauseIdFromSearch("sub-1")).toBe("sub-1");
    expect(
      digestSubscriptionsPanelsHrefFromSearch("tab=subscriptions", { pauseSubscriptionId: "sub-1" }),
    ).toBe("/architecture/digests?tab=subscriptions&pauseSubId=sub-1");
    expect(parseRecurrenceSchedulesDisableIdFromSearch("sched-1")).toBe("sched-1");
    expect(
      recurrenceSchedulesPanelsHrefFromSearch("", { disableScheduleId: "sched-1" }),
    ).toBe("/governance/recurrence-schedules?disableScheduleId=sched-1");
    expect(parseRootCauseClusterKeyFromSearch("cluster-a")).toBe("cluster-a");
    expect(parseRootCauseClusterDispFromSearch("accepted")).toBe("accepted");
    expect(rootCauseClusterDispositionToUrlValue("RejectedAsNotApplicable")).toBe("waived");
    expect(
      rootCauseClusterDispositionHrefFromSearch(
        "reviewTab=findings",
        { clusterKey: "cluster-a", disposition: "Accepted" },
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?reviewTab=findings&clusterKey=cluster-a&clusterDisp=accepted");
  });
});

describe("wave31 filter url helpers", () => {
  it("slack disable, teams remove, composite create confirm, wallet and SAML save confirms", async () => {
    const {
      parseSlackDisableIdFromSearch,
      slackDisableRouteHrefFromSearch,
    } = await import("@/lib/integrations/slack-disable-route-url");
    const {
      parseTeamsRemoveConfirmOpenFromSearch,
      teamsNotificationsRemoveConfirmHrefFromSearch,
    } = await import("@/lib/integrations/teams-notifications-remove-confirm-url");
    const {
      compositeAlertRulesPanelsHrefFromSearch,
      parseCompositeAlertRulesCreateConfirmOpenFromSearch,
    } = await import("@/lib/alerts/composite-alert-rules-panels-url");
    const {
      billingWalletSaveConfirmHrefFromSearch,
      parseBillingWalletSaveConfirmOpenFromSearch,
    } = await import("@/lib/administration/billing-wallet-save-confirm-url");
    const {
      parseSamlSaveConfirmOpenFromSearch,
      samlSaveConfirmHrefFromSearch,
    } = await import("@/lib/administration/saml-save-confirm-url");

    expect(parseSlackDisableIdFromSearch("sub-1")).toBe("sub-1");
    expect(slackDisableRouteHrefFromSearch("", "sub-1")).toBe("/integrations/slack?slackDisableId=sub-1");
    expect(parseTeamsRemoveConfirmOpenFromSearch("1")).toBe(true);
    expect(teamsNotificationsRemoveConfirmHrefFromSearch("", true)).toBe(
      "/integrations/teams?teamsRemoveConfirm=1",
    );
    expect(parseCompositeAlertRulesCreateConfirmOpenFromSearch("true")).toBe(true);
    expect(
      compositeAlertRulesPanelsHrefFromSearch("create=1", { showCreateConfirm: true }),
    ).toBe("/governance/alert-rules?create=1&compositeCreateConfirm=1");
    expect(parseBillingWalletSaveConfirmOpenFromSearch("1")).toBe(true);
    expect(billingWalletSaveConfirmHrefFromSearch("", true)).toBe(
      "/administration/billing?walletSaveConfirm=1",
    );
    expect(parseSamlSaveConfirmOpenFromSearch("1")).toBe(true);
    expect(samlSaveConfirmHrefFromSearch("", true)).toBe(
      "/administration/identity-providers/saml?samlSaveConfirm=1",
    );
  });

  it("engine reset, model profile action, SSO cancel, saved view delete, waiver revoke confirms", async () => {
    const {
      modelGovernanceEngineResetConfirmHrefFromSearch,
      parseModelGovernanceEngineResetConfirmOpenFromSearch,
    } = await import("@/lib/administration/model-governance-engine-reset-confirm-url");
    const {
      modelGovernanceProfileActionConfirmHrefFromSearch,
      parseModelGovernanceProfileActionFromSearch,
      parseModelGovernanceProfileIdFromSearch,
    } = await import("@/lib/administration/model-governance-profile-action-confirm-url");
    const {
      parseSsoWizardCancelConfirmOpenFromSearch,
      ssoWizardHrefFromSearch,
      SSO_WIZARD_PATH,
    } = await import("@/lib/administration/sso-wizard-step-url");
    const {
      operatorSavedViewPanelsHrefFromSearch,
      parseOperatorSavedViewDeleteConfirmOpenFromSearch,
    } = await import("@/lib/operator/operator-saved-view-url");
    const {
      findingInspectGovernancePanelHrefFromSearch,
      parseFindingInspectWaiverRevokeConfirmOpenFromSearch,
    } = await import("@/lib/findings/finding-inspect-governance-panel-url");

    expect(parseModelGovernanceEngineResetConfirmOpenFromSearch("1")).toBe(true);
    expect(modelGovernanceEngineResetConfirmHrefFromSearch("", true)).toBe(
      "/administration/model-governance?engineResetConfirm=1",
    );
    expect(parseModelGovernanceProfileActionFromSearch("select")).toBe("select");
    expect(parseModelGovernanceProfileIdFromSearch("Balanced")).toBe("Balanced");
    expect(
      modelGovernanceProfileActionConfirmHrefFromSearch("", {
        action: "select",
        profileId: "Balanced",
      }),
    ).toBe("/administration/model-governance?modelProfileAction=select&modelProfileId=Balanced");
    expect(
      modelGovernanceProfileActionConfirmHrefFromSearch("", {
        action: "clear",
        profileId: null,
      }),
    ).toBe("/administration/model-governance?modelProfileAction=clear");
    expect(parseSsoWizardCancelConfirmOpenFromSearch("1")).toBe(true);
    expect(
      ssoWizardHrefFromSearch("step=2", { stepIndex: 2, cancelConfirmOpen: true }, SSO_WIZARD_PATH),
    ).toBe("/administration/identity/sso-wizard?step=2&ssoCancelConfirm=1");
    expect(parseOperatorSavedViewDeleteConfirmOpenFromSearch("true")).toBe(true);
    expect(
      operatorSavedViewPanelsHrefFromSearch(
        "viewId=v1",
        { viewId: "v1", deleteConfirmOpen: true },
        "/governance/audit",
      ),
    ).toBe("/governance/audit?viewId=v1&savedViewDeleteConfirm=1");
    expect(parseFindingInspectWaiverRevokeConfirmOpenFromSearch("1")).toBe(true);
    expect(
      findingInspectGovernancePanelHrefFromSearch(
        "govPanel=waiver",
        { panel: "waiver", waiverConfirmOpen: false, waiverRevokeConfirmOpen: true },
        "/architecture/reviews/r1/findings/f1/inspect",
      ),
    ).toBe(
      "/architecture/reviews/r1/findings/f1/inspect?govPanel=waiver&waiverRevokeConfirm=1",
    );
  });
});

describe("wave32 filter url helpers", () => {
  it("governance bulk disposition, DLQ confirms, invite revoke, and role assignment confirms", async () => {
    const {
      governanceFindingsBulkDispositionConfirmHrefFromSearch,
      governanceAssignedToMeBulkDispositionConfirmHrefFromSearch,
      governanceFindingsBulkDispositionFromUrlValue,
      governanceFindingsBulkDispositionToUrlValue,
      parseGovernanceFindingsBulkDispositionConfirmFromSearch,
    } = await import("@/lib/governance/governance-findings-bulk-disposition-confirm-url");
    const {
      integrationEventsDlqConfirmHrefFromSearch,
      parseIntegrationEventsDlqBulkRetryConfirmOpenFromSearch,
      parseIntegrationEventsDlqSuppressIdFromSearch,
    } = await import("@/lib/internal/integration-events-dlq-confirm-url");
    const {
      parseSettingsUsersRevokeInviteIdFromSearch,
      settingsUsersInviteRevokeHrefFromSearch,
    } = await import("@/lib/administration/settings-users-invite-revoke-url");
    const {
      parseSettingsUsersRoleConfirmNextRoleFromSearch,
      parseSettingsUsersRoleConfirmPrincipalIdFromSearch,
      settingsUsersRoleConfirmHrefFromSearch,
    } = await import("@/lib/administration/settings-users-role-confirm-url");

    expect(parseGovernanceFindingsBulkDispositionConfirmFromSearch("waived")).toBe("waived");
    expect(governanceFindingsBulkDispositionToUrlValue("Accepted")).toBe("accepted");
    expect(governanceFindingsBulkDispositionFromUrlValue("deferred")).toBe("Deferred");
    expect(
      governanceFindingsBulkDispositionConfirmHrefFromSearch("bulkFindings=f1", "accepted"),
    ).toBe("/governance/findings?bulkFindings=f1&bulkDispConfirm=accepted");
    expect(
      governanceAssignedToMeBulkDispositionConfirmHrefFromSearch("", "waived"),
    ).toBe("/governance/findings/assigned-to-me?bulkDispConfirm=waived");
    expect(parseIntegrationEventsDlqBulkRetryConfirmOpenFromSearch("1")).toBe(true);
    expect(parseIntegrationEventsDlqSuppressIdFromSearch("outbox-1")).toBe("outbox-1");
    expect(
      integrationEventsDlqConfirmHrefFromSearch("", {
        bulkRetryConfirmOpen: true,
        suppressOutboxId: "outbox-1",
      }),
    ).toBe("/internal/failed-integration-messages?dlqBulkRetryConfirm=1&dlqSuppressId=outbox-1");
    expect(parseSettingsUsersRevokeInviteIdFromSearch("inv-1")).toBe("inv-1");
    expect(settingsUsersInviteRevokeHrefFromSearch("tab=users", "inv-1")).toBe(
      "/administration/users?tab=users&revokeInviteId=inv-1",
    );
    expect(parseSettingsUsersRoleConfirmPrincipalIdFromSearch("principal-1")).toBe("principal-1");
    expect(parseSettingsUsersRoleConfirmNextRoleFromSearch("Admin")).toBe("Admin");
    expect(
      settingsUsersRoleConfirmHrefFromSearch("", {
        principalId: "principal-1",
      …51199 tokens truncated…apForecastOpen=1",
    );
    expect(parseReviewChainOfCustodySectionKeyFromSearch("who-and-when")).toBe("who-and-when");
    expect(
      reviewChainOfCustodySectionDisclosureHrefFromSearch("", "who-and-when", "/architecture/reviews/run-1"),
    ).toBe("/architecture/reviews/run-1?reviewChainOfCustodySectionKey=who-and-when");
  });
});

describe("wave72 filter url helpers", () => {
  it("engineering troubleshooting sources, accelerator cost governance technical, sponsor dashboard/scorecard, audit lineage route/spine, first pilot l0, glossary section, infra resource hub technical params", async () => {
    const {
      helpEngineeringTroubleshootingRunbookSourcesDisclosureHrefFromSearch,
      parseHelpEngineeringTroubleshootingRunbookSourcesOpenFromSearch,
    } = await import("@/lib/help/help-engineering-troubleshooting-runbook-sources-disclosure-url");
    const {
      helpEngineeringTroubleshootingSourcesDisclosureHrefFromSearch,
      parseHelpEngineeringTroubleshootingSourcesOpenFromSearch,
    } = await import("@/lib/help/help-engineering-troubleshooting-sources-disclosure-url");
    const {
      helpAcceleratorCostGovernanceTechnicalDisclosureHrefFromSearch,
      parseHelpAcceleratorCostGovernanceTechnicalOpenFromSearch,
    } = await import("@/lib/accelerator/help-accelerator-cost-governance-technical-disclosure-url");
    const {
      parseSponsorDashboardHowItWorksOpenFromSearch,
      sponsorDashboardHowItWorksDisclosureHrefFromSearch,
    } = await import("@/lib/sponsor/sponsor-dashboard-how-it-works-disclosure-url");
    const {
      parseSponsorScorecardEmptyPreviewOpenFromSearch,
      sponsorScorecardEmptyPreviewDisclosureHrefFromSearch,
    } = await import("@/lib/sponsor/sponsor-scorecard-empty-preview-disclosure-url");
    const {
      auditEvidenceLineageRouteIdentifiersDisclosureHrefFromSearch,
      parseAuditEvidenceLineageRouteIdentifiersOpenFromSearch,
    } = await import("@/lib/governance/audit-evidence-lineage-route-identifiers-disclosure-url");
    const {
      auditEvidenceLineageSpineTechnicalDisclosureHrefFromSearch,
      parseAuditEvidenceLineageSpineTechnicalOpenFromSearch,
    } = await import("@/lib/governance/audit-evidence-lineage-spine-technical-disclosure-url");
    const {
      firstPilotL0MustQuestionsDisclosureHrefFromSearch,
      parseFirstPilotL0MustQuestionsOpenFromSearch,
    } = await import("@/lib/first-pilot/first-pilot-l0-must-questions-disclosure-url");
    const {
      parseProductConceptsGlossarySectionOpenFromSearch,
      productConceptsGlossarySectionDisclosureHrefFromSearch,
    } = await import("@/lib/operator/product-concepts-glossary-section-disclosure-url");
    const {
      infraResourceHubTechnicalDisclosureHrefFromSearch,
      parseInfraResourceHubTechnicalKeyFromSearch,
    } = await import("@/lib/infra-evidence/infra-resource-hub-technical-disclosure-url");

    expect(parseHelpEngineeringTroubleshootingRunbookSourcesOpenFromSearch("1")).toBe(true);
    expect(
      helpEngineeringTroubleshootingRunbookSourcesDisclosureHrefFromSearch("", true, "/help/engineering-troubleshooting"),
    ).toBe("/help/engineering-troubleshooting?helpEngineeringTroubleshootingRunbookSourcesOpen=1");
    expect(parseHelpEngineeringTroubleshootingSourcesOpenFromSearch("true")).toBe(true);
    expect(
      helpEngineeringTroubleshootingSourcesDisclosureHrefFromSearch("symptom=auth", true, "/help/engineering-troubleshooting"),
    ).toBe("/help/engineering-troubleshooting?symptom=auth&helpEngineeringTroubleshootingSourcesOpen=1");
    expect(parseHelpAcceleratorCostGovernanceTechnicalOpenFromSearch("1")).toBe(true);
    expect(
      helpAcceleratorCostGovernanceTechnicalDisclosureHrefFromSearch("", true, "/help/accelerator-chooser"),
    ).toBe("/help/accelerator-chooser?helpAcceleratorCostGovernanceTechnicalOpen=1");
    expect(parseSponsorDashboardHowItWorksOpenFromSearch("true")).toBe(true);
    expect(sponsorDashboardHowItWorksDisclosureHrefFromSearch("", true, "/architecture/sponsor-dashboard")).toBe(
      "/architecture/sponsor-dashboard?sponsorDashboardHowItWorksOpen=1",
    );
    expect(parseSponsorScorecardEmptyPreviewOpenFromSearch("1")).toBe(true);
    expect(sponsorScorecardEmptyPreviewDisclosureHrefFromSearch("", true, "/insights/architecture-scorecard")).toBe(
      "/insights/architecture-scorecard?sponsorScorecardEmptyPreviewOpen=1",
    );
    expect(parseAuditEvidenceLineageRouteIdentifiersOpenFromSearch("true")).toBe(true);
    expect(
      auditEvidenceLineageRouteIdentifiersDisclosureHrefFromSearch(
        "",
        true,
        "/governance/audit-evidence/a1/snapshots/s1/controls/c1",
      ),
    ).toBe("/governance/audit-evidence/a1/snapshots/s1/controls/c1?auditEvidenceLineageRouteIdentifiersOpen=1");
    expect(parseAuditEvidenceLineageSpineTechnicalOpenFromSearch("1")).toBe(true);
    expect(
      auditEvidenceLineageSpineTechnicalDisclosureHrefFromSearch(
        "expanded=1",
        true,
        "/governance/audit-evidence/a1/snapshots/s1/controls/c1",
      ),
    ).toBe(
      "/governance/audit-evidence/a1/snapshots/s1/controls/c1?expanded=1&auditEvidenceLineageSpineTechnicalOpen=1",
    );
    expect(parseFirstPilotL0MustQuestionsOpenFromSearch("1")).toBe(true);
    expect(firstPilotL0MustQuestionsDisclosureHrefFromSearch("path=first-pilot", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?path=first-pilot&firstPilotL0MustQuestionsOpen=1",
    );
    expect(parseProductConceptsGlossarySectionOpenFromSearch("true")).toBe(true);
    expect(productConceptsGlossarySectionDisclosureHrefFromSearch("q=review", true, "/help")).toBe(
      "/help?q=review&productConceptsGlossarySectionOpen=1",
    );
    expect(parseInfraResourceHubTechnicalKeyFromSearch("cloudResourceId")).toBe("cloudResourceId");
    expect(parseInfraResourceHubTechnicalKeyFromSearch("invalid")).toBe("");
    expect(
      infraResourceHubTechnicalDisclosureHrefFromSearch(
        "tab=overview",
        "terraformAddress",
        "/governance/infrastructure/resources/res-1",
      ),
    ).toBe(
      "/governance/infrastructure/resources/res-1?tab=overview&infraResourceHubTechnicalKey=terraformAddress",
    );
  });
});

describe("wave73 filter url helpers", () => {
  it("remediation/drift/diagram workbench resource ids, resource row arm id, governance findings resource group, advisory schedule advanced params", async () => {
    const {
      infraRemediationResourceIdDisclosureHrefFromSearch,
      parseInfraRemediationResourceIdDisclosureOpenFromSearch,
    } = await import("@/lib/infra-evidence/infra-remediation-resource-id-disclosure-url");
    const {
      infraRemediationFindingIdDisclosureHrefFromSearch,
      parseInfraRemediationFindingIdDisclosureOpenFromSearch,
    } = await import("@/lib/infra-evidence/infra-remediation-finding-id-disclosure-url");
    const {
      infraRemediationVerifyHintDisclosureHrefFromSearch,
      parseInfraRemediationVerifyHintDisclosureOpenFromSearch,
    } = await import("@/lib/infra-evidence/infra-remediation-verify-hint-disclosure-url");
    const {
      infraDriftResourceIdDisclosureHrefFromSearch,
      parseInfraDriftResourceIdDisclosureOpenFromSearch,
    } = await import("@/lib/infra-evidence/infra-drift-resource-id-disclosure-url");
    const {
      infraDiagramReconcileResourceIdDisclosureHrefFromSearch,
      parseInfraDiagramReconcileResourceIdDisclosureOpenFromSearch,
    } = await import("@/lib/infra-evidence/infra-diagram-reconcile-resource-id-disclosure-url");
    const {
      infraDiagramsResourceIdDisclosureHrefFromSearch,
      parseInfraDiagramsResourceIdDisclosureOpenFromSearch,
    } = await import("@/lib/infra-evidence/infra-diagrams-resource-id-disclosure-url");
    const {
      infraResourceRowArmIdDisclosureHrefFromSearch,
      parseInfraResourceRowArmIdDisclosureKeyFromSearch,
    } = await import("@/lib/infra-evidence/infra-resource-row-arm-id-disclosure-url");
    const {
      governanceFindingsResourceGroupDisclosureHrefFromSearch,
      parseGovernanceFindingsResourceGroupKeyFromSearch,
    } = await import("@/lib/governance/governance-findings-resource-group-disclosure-url");
    const {
      advisoryScheduleAdvancedDisclosureHrefFromSearch,
      parseAdvisoryScheduleAdvancedOpenFromSearch,
    } = await import("@/lib/advisory/advisory-schedule-advanced-disclosure-url");

    expect(parseInfraRemediationResourceIdDisclosureOpenFromSearch("true")).toBe(true);
    expect(
      infraRemediationResourceIdDisclosureHrefFromSearch("", true, "/governance/infrastructure/remediation"),
    ).toBe("/governance/infrastructure/remediation?infraRemediationResourceIdDisclosureOpen=1");
    expect(parseInfraRemediationFindingIdDisclosureOpenFromSearch("1")).toBe(true);
    expect(
      infraRemediationFindingIdDisclosureHrefFromSearch("findingId=f-1", true, "/governance/infrastructure/remediation"),
    ).toBe("/governance/infrastructure/remediation?findingId=f-1&infraRemediationFindingIdDisclosureOpen=1");
    expect(parseInfraRemediationVerifyHintDisclosureOpenFromSearch("true")).toBe(true);
    expect(
      infraRemediationVerifyHintDisclosureHrefFromSearch("", true, "/governance/infrastructure/remediation"),
    ).toBe("/governance/infrastructure/remediation?infraRemediationVerifyHintDisclosureOpen=1");
    expect(parseInfraDriftResourceIdDisclosureOpenFromSearch("1")).toBe(true);
    expect(infraDriftResourceIdDisclosureHrefFromSearch("", true, "/governance/infrastructure/drift")).toBe(
      "/governance/infrastructure/drift?infraDriftResourceIdDisclosureOpen=1",
    );
    expect(parseInfraDiagramReconcileResourceIdDisclosureOpenFromSearch("true")).toBe(true);
    expect(
      infraDiagramReconcileResourceIdDisclosureHrefFromSearch("", true, "/governance/infrastructure/diagram-reconcile"),
    ).toBe("/governance/infrastructure/diagram-reconcile?infraDiagramReconcileResourceIdDisclosureOpen=1");
    expect(parseInfraDiagramsResourceIdDisclosureOpenFromSearch("1")).toBe(true);
    expect(infraDiagramsResourceIdDisclosureHrefFromSearch("", true, "/governance/infrastructure/diagrams")).toBe(
      "/governance/infrastructure/diagrams?infraDiagramsResourceIdDisclosureOpen=1",
    );
    expect(parseInfraResourceRowArmIdDisclosureKeyFromSearch("res-uuid-1")).toBe("res-uuid-1");
    expect(
      infraResourceRowArmIdDisclosureHrefFromSearch(
        "workQueue=drift",
        "res-uuid-1",
        "/governance/infrastructure/resources",
      ),
    ).toBe("/governance/infrastructure/resources?workQueue=drift&infraResourceRowArmIdDisclosureKey=res-uuid-1");
    expect(parseGovernanceFindingsResourceGroupKeyFromSearch("rg-prod")).toBe("rg-prod");
    expect(
      governanceFindingsResourceGroupDisclosureHrefFromSearch("", "rg-prod", "/governance/findings"),
    ).toBe("/governance/findings?governanceFindingsResourceGroupKey=rg-prod");
    expect(parseAdvisoryScheduleAdvancedOpenFromSearch("1")).toBe(true);
    expect(advisoryScheduleAdvancedDisclosureHrefFromSearch("tab=schedules", true, "/insights/advisory-scans")).toBe(
      "/insights/advisory-scans?tab=schedules&advisoryScheduleAdvancedOpen=1",
    );
  });
});

describe("wave74 filter url helpers", () => {
  it("engineering troubleshooting markdown section, caiq sig deferred, dlq advanced, bundled policy pack file, report problem surface tech, demo explain technical, onboarding optional setup, operator home advanced guidance, first week route guidance home params", async () => {
    const {
      helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch,
      parseHelpEngineeringTroubleshootingMarkdownSectionKeyFromSearch,
    } = await import("@/lib/help/help-engineering-troubleshooting-markdown-section-disclosure-url");
    const {
      helpCaiqSigResponseSigDeferredDisclosureHrefFromSearch,
      parseHelpCaiqSigResponseSigDeferredOpenFromSearch,
    } = await import("@/lib/help/help-caiq-sig-response-sig-deferred-disclosure-url");
    const {
      integrationEventsDlqAdvancedDisclosureHrefFromSearch,
      parseIntegrationEventsDlqAdvancedKeyFromSearch,
    } = await import("@/lib/internal/integration-events-dlq-advanced-disclosure-url");
    const {
      platformBundledPolicyPackFileDisclosureHrefFromSearch,
      parsePlatformBundledPolicyPackFileKeyFromSearch,
    } = await import("@/lib/internal/platform-bundled-policy-pack-file-disclosure-url");
    const {
      reportProblemSurfaceTechDisclosureHrefFromSearch,
      parseReportProblemSurfaceTechKeyFromSearch,
    } = await import("@/lib/support/report-problem-surface-tech-disclosure-url");
    const {
      demoExplainExplanationTechnicalDisclosureHrefFromSearch,
      parseDemoExplainExplanationTechnicalOpenFromSearch,
    } = await import("@/lib/demo-explain-explanation-technical-disclosure-url");
    const {
      demoExplainGraphTechnicalDisclosureHrefFromSearch,
      parseDemoExplainGraphTechnicalOpenFromSearch,
    } = await import("@/lib/demo-explain-graph-technical-disclosure-url");
    const {
      onboardingOptionalSetupDisclosureHrefFromSearch,
      parseOnboardingOptionalSetupOpenFromSearch,
    } = await import("@/lib/first-review/onboarding-optional-setup-disclosure-url");
    const {
      operatorHomeAdvancedGuidanceDisclosureHrefFromSearch,
      parseOperatorHomeAdvancedGuidanceOpenFromSearch,
    } = await import("@/lib/operator/operator-home-advanced-guidance-disclosure-url");
    const {
      firstWeekRouteGuidanceHomeDisclosureHrefFromSearch,
      parseFirstWeekRouteGuidanceHomeOpenFromSearch,
    } = await import("@/lib/operator/first-week-route-guidance-home-disclosure-url");

    expect(parseHelpEngineeringTroubleshootingMarkdownSectionKeyFromSearch("auth-token-expired")).toBe(
      "auth-token-expired",
    );
    expect(
      helpEngineeringTroubleshootingMarkdownSectionDisclosureHrefFromSearch(
        "symptom=auth",
        "auth-token-expired",
        "/help/engineering-troubleshooting",
      ),
    ).toBe(
      "/help/engineering-troubleshooting?symptom=auth&helpEngineeringTroubleshootingMarkdownSectionKey=auth-token-expired",
    );
    expect(parseHelpCaiqSigResponseSigDeferredOpenFromSearch("1")).toBe(true);
    expect(
      helpCaiqSigResponseSigDeferredDisclosureHrefFromSearch("", true, "/help/caiq-sig-response"),
    ).toBe("/help/caiq-sig-response?helpCaiqSigResponseSigDeferredOpen=1");
    expect(parseIntegrationEventsDlqAdvancedKeyFromSearch("outbox-42")).toBe("outbox-42");
    expect(
      integrationEventsDlqAdvancedDisclosureHrefFromSearch("eventType=ticketing", "outbox-42", "/internal/failed-integration-messages"),
    ).toBe("/internal/failed-integration-messages?eventType=ticketing&integrationEventsDlqAdvancedKey=outbox-42");
    expect(parsePlatformBundledPolicyPackFileKeyFromSearch("bundles/foo.json")).toBe("bundles/foo.json");
    expect(
      platformBundledPolicyPackFileDisclosureHrefFromSearch("q=waf", "bundles/foo.json", "/internal/platform-bundled-policy-packs"),
    ).toBe("/internal/platform-bundled-policy-packs?q=waf&platformBundledPolicyPackFileKey=bundles%2Ffoo.json");
    expect(parseReportProblemSurfaceTechKeyFromSearch("reviews-hub-fatal")).toBe("reviews-hub-fatal");
    expect(
      reportProblemSurfaceTechDisclosureHrefFromSearch("", "reviews-hub-fatal", "/help/report-a-problem"),
    ).toBe("/help/report-a-problem?reportProblemSurfaceTechKey=reviews-hub-fatal");
    expect(parseDemoExplainExplanationTechnicalOpenFromSearch("true")).toBe(true);
    expect(
      demoExplainExplanationTechnicalDisclosureHrefFromSearch("reviewId=r1", true, "/demo/explain"),
    ).toBe("/demo/explain?reviewId=r1&demoExplainExplanationTechnicalOpen=1");
    expect(parseDemoExplainGraphTechnicalOpenFromSearch("1")).toBe(true);
    expect(demoExplainGraphTechnicalDisclosureHrefFromSearch("", true, "/demo/explain")).toBe(
      "/demo/explain?demoExplainGraphTechnicalOpen=1",
    );
    expect(parseOnboardingOptionalSetupOpenFromSearch("1")).toBe(true);
    expect(
      onboardingOptionalSetupDisclosureHrefFromSearch("", true, "/architecture/first-review-guide"),
    ).toBe("/architecture/first-review-guide?onboardingOptionalSetupOpen=1");
    expect(parseOperatorHomeAdvancedGuidanceOpenFromSearch("true")).toBe(true);
    expect(operatorHomeAdvancedGuidanceDisclosureHrefFromSearch("", true, "/")).toBe(
      "/?operatorHomeAdvancedGuidanceOpen=1",
    );
    expect(parseFirstWeekRouteGuidanceHomeOpenFromSearch("1")).toBe(true);
    expect(firstWeekRouteGuidanceHomeDisclosureHrefFromSearch("", true, "/")).toBe(
      "/?firstWeekRouteGuidanceHomeOpen=1",
    );
  });
});

describe("wave75 filter url helpers", () => {
  it("operator home workspace status, first pilot readiness cockpit/details/assistant diagnostics, core pilot checklist/diagnostics/next steps, first week review detail guidance, policy pack technical details params", async () => {
    const {
      operatorHomeWorkspaceStatusDisclosureHrefFromSearch,
      parseOperatorHomeWorkspaceStatusOpenFromSearch,
    } = await import("@/lib/operator/operator-home-workspace-status-disclosure-url");
    const {
      firstPilotReadinessCockpitDisclosureHrefFromSearch,
      parseFirstPilotReadinessCockpitOpenFromSearch,
    } = await import("@/lib/first-pilot/first-pilot-readiness-cockpit-disclosure-url");
    const {
      firstPilotReadinessDetailsDisclosureHrefFromSearch,
      parseFirstPilotReadinessDetailsOpenFromSearch,
    } = await import("@/lib/first-pilot/first-pilot-readiness-details-disclosure-url");
    const {
      firstPilotAssistantDiagnosticsDisclosureHrefFromSearch,
      parseFirstPilotAssistantDiagnosticsOpenFromSearch,
    } = await import("@/lib/first-pilot/first-pilot-assistant-diagnostics-disclosure-url");
    const {
      corePilotChecklistDisclosureHrefFromSearch,
      parseCorePilotChecklistOpenFromSearch,
    } = await import("@/lib/operator/core-pilot-checklist-disclosure-url");
    const {
      corePilotDiagnosticsChecklistDisclosureHrefFromSearch,
      parseCorePilotDiagnosticsChecklistOpenFromSearch,
    } = await import("@/lib/operator/core-pilot-diagnostics-checklist-disclosure-url");
    const {
      firstWeekRouteGuidanceReviewDetailDisclosureHrefFromSearch,
      parseFirstWeekRouteGuidanceReviewDetailOpenFromSearch,
    } = await import("@/lib/operator/first-week-route-guidance-review-detail-disclosure-url");
    const {
      corePilotNextStepsDisclosureHrefFromSearch,
      parseCorePilotNextStepsOpenFromSearch,
    } = await import("@/lib/operator/core-pilot-next-steps-disclosure-url");
    const {
      corePilotNextStepsCompleteDisclosureHrefFromSearch,
      parseCorePilotNextStepsCompleteOpenFromSearch,
    } = await import("@/lib/operator/core-pilot-next-steps-complete-disclosure-url");
    const {
      policyPackTechnicalDetailsDisclosureHrefFromSearch,
      parsePolicyPackTechnicalDetailsOpenFromSearch,
    } = await import("@/lib/policy/policy-pack-technical-details-disclosure-url");

    expect(parseOperatorHomeWorkspaceStatusOpenFromSearch("1")).toBe(true);
    expect(operatorHomeWorkspaceStatusDisclosureHrefFromSearch("", true, "/")).toBe(
      "/?operatorHomeWorkspaceStatusOpen=1",
    );
    expect(parseFirstPilotReadinessCockpitOpenFromSearch("true")).toBe(true);
    expect(firstPilotReadinessCockpitDisclosureHrefFromSearch("", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?firstPilotReadinessCockpitOpen=1",
    );
    expect(parseFirstPilotReadinessDetailsOpenFromSearch("1")).toBe(true);
    expect(firstPilotReadinessDetailsDisclosureHrefFromSearch("path=first-pilot", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?path=first-pilot&firstPilotReadinessDetailsOpen=1",
    );
    expect(parseFirstPilotAssistantDiagnosticsOpenFromSearch("true")).toBe(true);
    expect(
      firstPilotAssistantDiagnosticsDisclosureHrefFromSearch("", true, "/architecture/reviews/new"),
    ).toBe("/architecture/reviews/new?firstPilotAssistantDiagnosticsOpen=1");
    expect(parseCorePilotChecklistOpenFromSearch("1")).toBe(true);
    expect(corePilotChecklistDisclosureHrefFromSearch("", true, "/")).toBe("/?corePilotChecklistOpen=1");
    expect(parseCorePilotDiagnosticsChecklistOpenFromSearch("true")).toBe(true);
    expect(corePilotDiagnosticsChecklistDisclosureHrefFromSearch("", true, "/")).toBe(
      "/?corePilotDiagnosticsChecklistOpen=1",
    );
    expect(parseFirstWeekRouteGuidanceReviewDetailOpenFromSearch("1")).toBe(true);
    expect(
      firstWeekRouteGuidanceReviewDetailDisclosureHrefFromSearch("tab=overview", true, "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?tab=overview&firstWeekRouteGuidanceReviewDetailOpen=1");
    expect(parseCorePilotNextStepsOpenFromSearch("true")).toBe(true);
    expect(corePilotNextStepsDisclosureHrefFromSearch("", true, "/")).toBe("/?corePilotNextStepsOpen=1");
    expect(parseCorePilotNextStepsCompleteOpenFromSearch("1")).toBe(true);
    expect(corePilotNextStepsCompleteDisclosureHrefFromSearch("", true, "/")).toBe(
      "/?corePilotNextStepsCompleteOpen=1",
    );
    expect(parsePolicyPackTechnicalDetailsOpenFromSearch("true")).toBe(true);
    expect(
      policyPackTechnicalDetailsDisclosureHrefFromSearch("", true, "/governance/policy-packs/responsible-ai"),
    ).toBe("/governance/policy-packs/responsible-ai?policyPackTechnicalDetailsOpen=1");
  });
});

describe("wave76 filter url helpers", () => {
  it("governance resolution raw output, wizard step advanced surfaces, workspace ai probe debug metadata, demo explain status technical, operator route diagnostics, recurrence post commit, after core pilot whats next params", async () => {
    const {
      governanceResolutionRawOutputDisclosureHrefFromSearch,
      parseGovernanceResolutionRawOutputOpenFromSearch,
    } = await import("@/lib/governance/governance-resolution-raw-output-disclosure-url");
    const {
      wizardStepAdvancedDisclosureHrefFromSearch,
      parseWizardStepAdvancedOpenFromSearch,
    } = await import("@/lib/wizard/wizard-step-advanced-disclosure-url");
    const {
      wizardStepIdentityAdvancedDisclosureHrefFromSearch,
      parseWizardStepIdentityAdvancedOpenFromSearch,
    } = await import("@/lib/wizard/wizard-step-identity-advanced-disclosure-url");
    const {
      wizardStepDescriptionAdvancedDisclosureHrefFromSearch,
      parseWizardStepDescriptionAdvancedOpenFromSearch,
    } = await import("@/lib/wizard/wizard-step-description-advanced-disclosure-url");
    const {
      wizardStepConstraintsAdvancedDisclosureHrefFromSearch,
      parseWizardStepConstraintsAdvancedOpenFromSearch,
    } = await import("@/lib/wizard/wizard-step-constraints-advanced-disclosure-url");
    const {
      workspaceAiProbeDebugMetadataDisclosureHrefFromSearch,
      parseWorkspaceAiProbeDebugMetadataOpenFromSearch,
    } = await import("@/lib/reviews/workspace-ai-probe-debug-metadata-disclosure-url");
    const {
      demoExplainStatusTechnicalDisclosureHrefFromSearch,
      parseDemoExplainStatusTechnicalOpenFromSearch,
    } = await import("@/lib/demo-explain-status-technical-disclosure-url");
    const {
      operatorRouteDiagnosticsDisclosureHrefFromSearch,
      parseOperatorRouteDiagnosticsOpenFromSearch,
    } = await import("@/lib/operator/operator-route-diagnostics-disclosure-url");
    const {
      recurrenceSchedulePostCommitDisclosureHrefFromSearch,
      parseRecurrenceSchedulePostCommitOpenFromSearch,
    } = await import("@/lib/governance/recurrence-schedule-post-commit-disclosure-url");
    const {
      afterCorePilotWhatsNextDisclosureHrefFromSearch,
      parseAfterCorePilotWhatsNextOpenFromSearch,
    } = await import("@/lib/operator/after-core-pilot-whats-next-disclosure-url");

    expect(parseGovernanceResolutionRawOutputOpenFromSearch("1")).toBe(true);
    expect(
      governanceResolutionRawOutputDisclosureHrefFromSearch("", true, "/governance/standards-and-rules"),
    ).toBe("/governance/standards-and-rules?governanceResolutionRawOutputOpen=1");
    expect(parseWizardStepAdvancedOpenFromSearch("true")).toBe(true);
    expect(wizardStepAdvancedDisclosureHrefFromSearch("qsStep=5", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?qsStep=5&wizardStepAdvancedOpen=1",
    );
    expect(parseWizardStepIdentityAdvancedOpenFromSearch("1")).toBe(true);
    expect(wizardStepIdentityAdvancedDisclosureHrefFromSearch("", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?wizardStepIdentityAdvancedOpen=1",
    );
    expect(parseWizardStepDescriptionAdvancedOpenFromSearch("true")).toBe(true);
    expect(wizardStepDescriptionAdvancedDisclosureHrefFromSearch("qsStep=3", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?qsStep=3&wizardStepDescriptionAdvancedOpen=1",
    );
    expect(parseWizardStepConstraintsAdvancedOpenFromSearch("1")).toBe(true);
    expect(wizardStepConstraintsAdvancedDisclosureHrefFromSearch("", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?wizardStepConstraintsAdvancedOpen=1",
    );
    expect(parseWorkspaceAiProbeDebugMetadataOpenFromSearch("true")).toBe(true);
    expect(
      workspaceAiProbeDebugMetadataDisclosureHrefFromSearch("tab=review-package", true, "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?tab=review-package&workspaceAiProbeDebugMetadataOpen=1");
    expect(parseDemoExplainStatusTechnicalOpenFromSearch("1")).toBe(true);
    expect(demoExplainStatusTechnicalDisclosureHrefFromSearch("reviewId=r1", true, "/demo/explain")).toBe(
      "/demo/explain?reviewId=r1&demoExplainStatusTechnicalOpen=1",
    );
    expect(parseOperatorRouteDiagnosticsOpenFromSearch("true")).toBe(true);
    expect(operatorRouteDiagnosticsDisclosureHrefFromSearch("", true, "/architecture/reviews/r1")).toBe(
      "/architecture/reviews/r1?operatorRouteDiagnosticsOpen=1",
    );
    expect(parseRecurrenceSchedulePostCommitOpenFromSearch("1")).toBe(true);
    expect(
      recurrenceSchedulePostCommitDisclosureHrefFromSearch("tab=overview", true, "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?tab=overview&recurrenceSchedulePostCommitOpen=1");
    expect(parseAfterCorePilotWhatsNextOpenFromSearch(null)).toBe(true);
    expect(parseAfterCorePilotWhatsNextOpenFromSearch("0")).toBe(false);
    expect(afterCorePilotWhatsNextDisclosureHrefFromSearch("", false, "/")).toBe("/?afterCorePilotWhatsNextOpen=0");
    expect(afterCorePilotWhatsNextDisclosureHrefFromSearch("afterCorePilotWhatsNextOpen=0", true, "/")).toBe("/");
  });
});

describe("wave77 filter url helpers", () => {
  it("policy pack generic/healthcare technical, policy packs inspect JSON, explainability trace section, structured brief explain key, finding typed payload, guided intake view all clarifications, governance raw output, operator route diagnostics params", async () => {
    const {
      policyPackGenericTechnicalDisclosureHrefFromSearch,
      parsePolicyPackGenericTechnicalOpenFromSearch,
    } = await import("@/lib/policy/policy-pack-generic-technical-disclosure-url");
    const {
      healthcareClaimsPackTechnicalDisclosureHrefFromSearch,
      parseHealthcareClaimsPackTechnicalOpenFromSearch,
    } = await import("@/lib/policy/healthcare-claims-pack-technical-disclosure-url");
    const {
      policyPacksEffectivePacksDisclosureHrefFromSearch,
      parsePolicyPacksEffectivePacksOpenFromSearch,
    } = await import("@/lib/governance/policy-packs-effective-packs-disclosure-url");
    const {
      policyPacksResolvedContentDisclosureHrefFromSearch,
      parsePolicyPacksResolvedContentOpenFromSearch,
    } = await import("@/lib/governance/policy-packs-resolved-content-disclosure-url");
    const {
      explainabilityTraceSectionDisclosureHrefFromSearch,
      parseExplainabilityTraceSectionKeyFromSearch,
    } = await import("@/lib/explainability/explainability-trace-section-disclosure-url");
    const {
      structuredBriefSuggestionExplainDisclosureHrefFromSearch,
      parseStructuredBriefSuggestionExplainKeyFromSearch,
    } = await import("@/lib/architecture/structured-brief-suggestion-explain-disclosure-url");
    const {
      findingInspectTypedPayloadDisclosureHrefFromSearch,
      parseFindingInspectTypedPayloadOpenFromSearch,
    } = await import("@/lib/findings/finding-inspect-typed-payload-disclosure-url");
    const {
      guidedIntakeViewAllClarificationsDisclosureHrefFromSearch,
      parseGuidedIntakeViewAllClarificationsOpenFromSearch,
    } = await import("@/lib/guided-intake/guided-intake-view-all-clarifications-disclosure-url");
    const {
      governanceResolutionRawOutputDisclosureHrefFromSearch,
      parseGovernanceResolutionRawOutputOpenFromSearch,
    } = await import("@/lib/governance/governance-resolution-raw-output-disclosure-url");
    const {
      operatorRouteDiagnosticsDisclosureHrefFromSearch,
      parseOperatorRouteDiagnosticsOpenFromSearch,
    } = await import("@/lib/operator/operator-route-diagnostics-disclosure-url");

    expect(parsePolicyPackGenericTechnicalOpenFromSearch("1")).toBe(true);
    expect(policyPackGenericTechnicalDisclosureHrefFromSearch("", true, "/governance/policy-packs/custom-pack")).toBe(
      "/governance/policy-packs/custom-pack?policyPackGenericTechnicalOpen=1",
    );
    expect(parseHealthcareClaimsPackTechnicalOpenFromSearch("true")).toBe(true);
    expect(
      healthcareClaimsPackTechnicalDisclosureHrefFromSearch("tab=catalog", true, "/governance/policy-packs/healthcare-claims"),
    ).toBe("/governance/policy-packs/healthcare-claims?tab=catalog&healthcareClaimsPackTechnicalOpen=1");
    expect(parsePolicyPacksEffectivePacksOpenFromSearch("1")).toBe(true);
    expect(policyPacksEffectivePacksDisclosureHrefFromSearch("", true, "/governance/policy-packs")).toBe(
      "/governance/policy-packs?policyPacksEffectivePacksOpen=1",
    );
    expect(parsePolicyPacksResolvedContentOpenFromSearch("true")).toBe(true);
    expect(policyPacksResolvedContentDisclosureHrefFromSearch("packId=p1", true, "/governance/policy-packs")).toBe(
      "/governance/policy-packs?packId=p1&policyPacksResolvedContentOpen=1",
    );
    expect(parseExplainabilityTraceSectionKeyFromSearch("evidence")).toBe("evidence");
    expect(
      explainabilityTraceSectionDisclosureHrefFromSearch("", "rules", "/architecture/reviews/run-1/findings/f-1"),
    ).toBe("/architecture/reviews/run-1/findings/f-1?explainabilityTraceSectionKey=rules");
    expect(parseStructuredBriefSuggestionExplainKeyFromSearch("actors:Reviewer")).toBe("actors:Reviewer");
    expect(
      structuredBriefSuggestionExplainDisclosureHrefFromSearch(
        "path=guided",
        "constraints:Zero trust",
        "/architecture/reviews/new",
      ),
    ).toBe("/architecture/reviews/new?path=guided&structuredBriefSuggestionExplainKey=constraints%3AZero+trust");
    expect(parseFindingInspectTypedPayloadOpenFromSearch("1")).toBe(true);
    expect(
      findingInspectTypedPayloadDisclosureHrefFromSearch("", true, "/architecture/reviews/run-1/findings/f-1"),
    ).toBe("/architecture/reviews/run-1/findings/f-1?findingInspectTypedPayloadOpen=1");
    expect(parseGuidedIntakeViewAllClarificationsOpenFromSearch("true")).toBe(true);
    expect(guidedIntakeViewAllClarificationsDisclosureHrefFromSearch("", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?guidedIntakeViewAllClarificationsOpen=1",
    );
    expect(parseGovernanceResolutionRawOutputOpenFromSearch("1")).toBe(true);
    expect(
      governanceResolutionRawOutputDisclosureHrefFromSearch("scope=workspace", true, "/governance/standards-and-rules/resolution"),
    ).toBe("/governance/standards-and-rules/resolution?scope=workspace&governanceResolutionRawOutputOpen=1");
    expect(parseOperatorRouteDiagnosticsOpenFromSearch("true")).toBe(true);
    expect(operatorRouteDiagnosticsDisclosureHrefFromSearch("", true, "/architecture/reviews/run-1")).toBe(
      "/architecture/reviews/run-1?operatorRouteDiagnosticsOpen=1",
    );
  });
});

describe("wave78 filter url helpers", () => {
  it("demo explain technical, wizard advanced steps, workspace AI probe debug metadata, recurrence post-commit, after core pilot what's next, architecture created governance/evidence sources params", async () => {
    const {
      demoExplainStatusTechnicalDisclosureHrefFromSearch,
      parseDemoExplainStatusTechnicalOpenFromSearch,
    } = await import("@/lib/demo-explain-status-technical-disclosure-url");
    const {
      wizardStepAdvancedDisclosureHrefFromSearch,
      parseWizardStepAdvancedOpenFromSearch,
    } = await import("@/lib/wizard/wizard-step-advanced-disclosure-url");
    const {
      wizardStepIdentityAdvancedDisclosureHrefFromSearch,
      parseWizardStepIdentityAdvancedOpenFromSearch,
    } = await import("@/lib/wizard/wizard-step-identity-advanced-disclosure-url");
    const {
      wizardStepDescriptionAdvancedDisclosureHrefFromSearch,
      parseWizardStepDescriptionAdvancedOpenFromSearch,
    } = await import("@/lib/wizard/wizard-step-description-advanced-disclosure-url");
    const {
      wizardStepConstraintsAdvancedDisclosureHrefFromSearch,
      parseWizardStepConstraintsAdvancedOpenFromSearch,
    } = await import("@/lib/wizard/wizard-step-constraints-advanced-disclosure-url");
    const {
      workspaceAiProbeDebugMetadataDisclosureHrefFromSearch,
      parseWorkspaceAiProbeDebugMetadataOpenFromSearch,
    } = await import("@/lib/reviews/workspace-ai-probe-debug-metadata-disclosure-url");
    const {
      recurrenceSchedulePostCommitDisclosureHrefFromSearch,
      parseRecurrenceSchedulePostCommitOpenFromSearch,
    } = await import("@/lib/governance/recurrence-schedule-post-commit-disclosure-url");
    const {
      afterCorePilotWhatsNextDisclosureHrefFromSearch,
      parseAfterCorePilotWhatsNextOpenFromSearch,
    } = await import("@/lib/operator/after-core-pilot-whats-next-disclosure-url");
    const {
      architectureCreatedGovernanceSourcesDisclosureHrefFromSearch,
      parseArchitectureCreatedGovernanceSourcesOpenFromSearch,
    } = await import("@/lib/architecture/architecture-created-governance-sources-disclosure-url");
    const {
      architectureCreatedEvidenceSourcesDisclosureHrefFromSearch,
      parseArchitectureCreatedEvidenceSourcesOpenFromSearch,
    } = await import("@/lib/architecture/architecture-created-evidence-sources-disclosure-url");

    expect(parseDemoExplainStatusTechnicalOpenFromSearch("1")).toBe(true);
    expect(demoExplainStatusTechnicalDisclosureHrefFromSearch("", true, "/demo/explain")).toBe(
      "/demo/explain?demoExplainStatusTechnicalOpen=1",
    );
    expect(parseWizardStepAdvancedOpenFromSearch("true")).toBe(true);
    expect(wizardStepAdvancedDisclosureHrefFromSearch("path=guided", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?path=guided&wizardStepAdvancedOpen=1",
    );
    expect(parseWizardStepIdentityAdvancedOpenFromSearch("1")).toBe(true);
    expect(wizardStepIdentityAdvancedDisclosureHrefFromSearch("", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?wizardStepIdentityAdvancedOpen=1",
    );
    expect(parseWizardStepDescriptionAdvancedOpenFromSearch("true")).toBe(true);
    expect(wizardStepDescriptionAdvancedDisclosureHrefFromSearch("step=description", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?step=description&wizardStepDescriptionAdvancedOpen=1",
    );
    expect(parseWizardStepConstraintsAdvancedOpenFromSearch("1")).toBe(true);
    expect(wizardStepConstraintsAdvancedDisclosureHrefFromSearch("", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?wizardStepConstraintsAdvancedOpen=1",
    );
    expect(parseWorkspaceAiProbeDebugMetadataOpenFromSearch("true")).toBe(true);
    expect(workspaceAiProbeDebugMetadataDisclosureHrefFromSearch("tab=availability", true, "/architecture/reviews/r1")).toBe(
      "/architecture/reviews/r1?tab=availability&workspaceAiProbeDebugMetadataOpen=1",
    );
    expect(parseRecurrenceSchedulePostCommitOpenFromSearch("1")).toBe(true);
    expect(recurrenceSchedulePostCommitDisclosureHrefFromSearch("", true, "/governance/recurrence")).toBe(
      "/governance/recurrence?recurrenceSchedulePostCommitOpen=1",
    );
    expect(parseAfterCorePilotWhatsNextOpenFromSearch("true")).toBe(true);
    expect(parseAfterCorePilotWhatsNextOpenFromSearch("0")).toBe(false);
    expect(afterCorePilotWhatsNextDisclosureHrefFromSearch("checklist=core", true, "/operator-home")).toBe(
      "/operator-home?checklist=core",
    );
    expect(afterCorePilotWhatsNextDisclosureHrefFromSearch("checklist=core", false, "/operator-home")).toBe(
      "/operator-home?checklist=core&afterCorePilotWhatsNextOpen=0",
    );
    expect(parseArchitectureCreatedGovernanceSourcesOpenFromSearch("1")).toBe(true);
    expect(
      architectureCreatedGovernanceSourcesDisclosureHrefFromSearch("", true, "/architecture/reviews/r1/governance"),
    ).toBe("/architecture/reviews/r1/governance?architectureCreatedGovernanceSourcesOpen=1");
    expect(parseArchitectureCreatedEvidenceSourcesOpenFromSearch("true")).toBe(true);
    expect(
      architectureCreatedEvidenceSourcesDisclosureHrefFromSearch("view=table", true, "/architecture/reviews/r1/evidence"),
    ).toBe("/architecture/reviews/r1/evidence?view=table&architectureCreatedEvidenceSourcesOpen=1");
  });
});


describe("wave81 filter url helpers", () => {
  it("architecture sponsor sharing, notification preference center relations, identity providers technical details, sso protocol help, architecture created governance/evidence sources, settings roles matrix collapsed groups, teams notifications collapsed categories, slack/teams platform notes params", async () => {
    const {
      architectureSponsorSharingDisclosureHrefFromSearch,
      parseArchitectureSponsorSharingOpenFromSearch,
    } = await import("@/lib/architecture/architecture-sponsor-sharing-disclosure-url");
    const {
      notificationPreferenceCenterRelationsDisclosureHrefFromSearch,
      parseNotificationPreferenceCenterRelationsOpenFromSearch,
    } = await import("@/lib/administration/notification-preference-center-relations-disclosure-url");
    const {
      identityProvidersTechnicalDetailsDisclosureHrefFromSearch,
      parseIdentityProvidersTechnicalDetailsOpenFromSearch,
    } = await import("@/lib/administration/identity-providers-technical-details-disclosure-url");
    const {
      parseSsoProtocolHelpOpenFromSearch,
      ssoProtocolHelpDisclosureHrefFromSearch,
    } = await import("@/lib/administration/sso-protocol-help-disclosure-url");
    const {
      architectureCreatedGovernanceSourcesDisclosureHrefFromSearch,
      parseArchitectureCreatedGovernanceSourcesOpenFromSearch,
    } = await import("@/lib/architecture/architecture-created-governance-sources-disclosure-url");
    const {
      architectureCreatedEvidenceSourcesDisclosureHrefFromSearch,
      parseArchitectureCreatedEvidenceSourcesOpenFromSearch,
    } = await import("@/lib/architecture/architecture-created-evidence-sources-disclosure-url");
    const {
      parseSettingsRolesMatrixCollapsedGroupsFromSearch,
      settingsRolesMatrixCollapsedGroupsDisclosureHrefFromSearch,
    } = await import("@/lib/administration/settings-roles-matrix-collapsed-groups-disclosure-url");
    const {
      parseTeamsNotificationsCollapsedCategoriesFromSearch,
      teamsNotificationsCollapsedCategoriesDisclosureHrefFromSearch,
    } = await import("@/lib/integrations/teams-notifications-collapsed-categories-disclosure-url");
    const {
      parseSlackPlatformNotesOpenFromSearch,
      slackPlatformNotesDisclosureHrefFromSearch,
    } = await import("@/lib/integrations/slack-platform-notes-disclosure-url");
    const {
      parseTeamsPlatformNotesOpenFromSearch,
      teamsPlatformNotesDisclosureHrefFromSearch,
    } = await import("@/lib/integrations/teams-platform-notes-disclosure-url");

    expect(parseArchitectureSponsorSharingOpenFromSearch("1")).toBe(true);
    expect(architectureSponsorSharingDisclosureHrefFromSearch("runId=r1", true, "/architecture/reviews/r1")).toBe(
      "/architecture/reviews/r1?runId=r1&architectureSponsorSharingOpen=1",
    );
    expect(parseNotificationPreferenceCenterRelationsOpenFromSearch("true")).toBe(true);
    expect(notificationPreferenceCenterRelationsDisclosureHrefFromSearch("", true, "/administration/notifications")).toBe(
      "/administration/notifications?notificationPreferenceCenterRelationsOpen=1",
    );
    expect(parseIdentityProvidersTechnicalDetailsOpenFromSearch("1")).toBe(true);
    expect(
      identityProvidersTechnicalDetailsDisclosureHrefFromSearch("", true, "/administration/identity-providers/diagnostics"),
    ).toBe("/administration/identity-providers/diagnostics?identityProvidersTechnicalDetailsOpen=1");
    expect(parseSsoProtocolHelpOpenFromSearch("true")).toBe(true);
    expect(ssoProtocolHelpDisclosureHrefFromSearch("step=protocol", true, "/administration/identity/sso-wizard")).toBe(
      "/administration/identity/sso-wizard?step=protocol&ssoProtocolHelpOpen=1",
    );
    expect(parseArchitectureCreatedGovernanceSourcesOpenFromSearch("1")).toBe(true);
    expect(
      architectureCreatedGovernanceSourcesDisclosureHrefFromSearch("", true, "/architecture/reviews/r1/governance"),
    ).toBe("/architecture/reviews/r1/governance?architectureCreatedGovernanceSourcesOpen=1");
    expect(parseArchitectureCreatedEvidenceSourcesOpenFromSearch("true")).toBe(true);
    expect(
      architectureCreatedEvidenceSourcesDisclosureHrefFromSearch("view=table", true, "/architecture/reviews/r1/evidence"),
    ).toBe("/architecture/reviews/r1/evidence?view=table&architectureCreatedEvidenceSourcesOpen=1");
    expect(parseSettingsRolesMatrixCollapsedGroupsFromSearch("admin,viewer")).toEqual(["admin", "viewer"]);
    expect(settingsRolesMatrixCollapsedGroupsDisclosureHrefFromSearch("tab=roles", ["admin"], "/administration/users")).toBe(
      "/administration/users?tab=roles&settingsRolesMatrixCollapsedGroups=admin",
    );
    expect(parseTeamsNotificationsCollapsedCategoriesFromSearch("architecture-and-review,governance-and-risk")).toEqual([
      "architecture-and-review",
      "governance-and-risk",
    ]);
    expect(
      teamsNotificationsCollapsedCategoriesDisclosureHrefFromSearch(
        "",
        ["architecture-and-review"],
        "/integrations/teams",
      ),
    ).toBe("/integrations/teams?teamsNotificationsCollapsedCategories=architecture-and-review");
    expect(parseSlackPlatformNotesOpenFromSearch("1")).toBe(true);
    expect(slackPlatformNotesDisclosureHrefFromSearch("", true, "/integrations/slack")).toBe(
      "/integrations/slack?slackPlatformNotesOpen=1",
    );
    expect(parseTeamsPlatformNotesOpenFromSearch("true")).toBe(true);
    expect(teamsPlatformNotesDisclosureHrefFromSearch("view=connect", true, "/integrations/teams")).toBe(
      "/integrations/teams?view=connect&teamsPlatformNotesOpen=1",
    );
  });
});

describe("wave82 filter url helpers", () => {
  it("infra drift change identifiers, audit evidence spine evidence technical row id, system health demo scope note, manifest top decisions show all, advisory scans manual id admin, quick scan privacy/scope, trust center and assurance status vocabulary params", async () => {
    const {
      infraDriftChangeIdentifiersDisclosureHrefFromSearch,
      parseInfraDriftChangeIdentifiersOpenFromSearch,
    } = await import("@/lib/infra-evidence/infra-drift-change-identifiers-disclosure-url");
    const {
      auditEvidenceSpineEvidenceTechnicalDisclosureHrefFromSearch,
      parseAuditEvidenceSpineEvidenceTechnicalRowIdFromSearch,
    } = await import("@/lib/governance/audit-evidence-spine-evidence-technical-disclosure-url");
    const {
      parseSystemHealthDemoScopeNoteOpenFromSearch,
      systemHealthDemoScopeNoteDisclosureHrefFromSearch,
    } = await import("@/lib/system-health/system-health-demo-scope-note-disclosure-url");
    const {
      manifestTopDecisionsShowAllDisclosureHrefFromSearch,
      parseManifestTopDecisionsShowAllOpenFromSearch,
    } = await import("@/lib/manifests/manifest-top-decisions-show-all-disclosure-url");
    const {
      advisoryScansManualIdAdminDisclosureHrefFromSearch,
      parseAdvisoryScansManualIdAdminOpenFromSearch,
    } = await import("@/lib/advisory/advisory-scans-manual-id-admin-disclosure-url");
    const {
      parseQuickScanPrivacyDisclosureOpenFromSearch,
      quickScanPrivacyDisclosureHrefFromSearch,
    } = await import("@/lib/quick-scan/quick-scan-privacy-disclosure-url");
    const {
      parseQuickScanScopeDisclosureOpenFromSearch,
      quickScanScopeDisclosureHrefFromSearch,
    } = await import("@/lib/quick-scan/quick-scan-scope-disclosure-url");
    const {
      parseTrustCenterVocabularyOpenFromSearch,
      trustCenterVocabularyDisclosureHrefFromSearch,
    } = await import("@/lib/trust-center/trust-center-vocabulary-disclosure-url");
    const {
      assuranceStatusVocabularyDisclosureHrefFromSearch,
      parseAssuranceStatusVocabularyOpenFromSearch,
    } = await import("@/lib/assurance-status/assurance-status-vocabulary-disclosure-url");

    expect(parseInfraDriftChangeIdentifiersOpenFromSearch("1")).toBe(true);
    expect(
      infraDriftChangeIdentifiersDisclosureHrefFromSearch("changeId=c1", true, "/governance/infrastructure/drift"),
    ).toBe("/governance/infrastructure/drift?changeId=c1&infraDriftChangeIdentifiersOpen=1");
    expect(parseAuditEvidenceSpineEvidenceTechnicalRowIdFromSearch("evidence-row-7")).toBe("evidence-row-7");
    expect(
      auditEvidenceSpineEvidenceTechnicalDisclosureHrefFromSearch(
        "tab=lineage",
        "evidence-row-7",
        "/governance/audit-evidence/a1/snapshots/s1/controls/c1",
      ),
    ).toBe(
      "/governance/audit-evidence/a1/snapshots/s1/controls/c1?tab=lineage&auditEvidenceSpineEvidenceTechnicalRowId=evidence-row-7",
    );
    expect(parseSystemHealthDemoScopeNoteOpenFromSearch("1")).toBe(true);
    expect(systemHealthDemoScopeNoteDisclosureHrefFromSearch("", true, "/administration/system-health")).toBe(
      "/administration/system-health?systemHealthDemoScopeNoteOpen=1",
    );
    expect(parseManifestTopDecisionsShowAllOpenFromSearch("true")).toBe(true);
    expect(
      manifestTopDecisionsShowAllDisclosureHrefFromSearch("view=summary", true, "/governance/sealed-records/manifest-1"),
    ).toBe("/governance/sealed-records/manifest-1?view=summary&manifestTopDecisionsShowAllOpen=1");
    expect(parseAdvisoryScansManualIdAdminOpenFromSearch("1")).toBe(true);
    expect(advisoryScansManualIdAdminDisclosureHrefFromSearch("runId=r1", true, "/insights/advisory-scans")).toBe(
      "/insights/advisory-scans?runId=r1&advisoryScansManualIdAdminOpen=1",
    );
    expect(parseQuickScanPrivacyDisclosureOpenFromSearch("true")).toBe(true);
    expect(quickScanPrivacyDisclosureHrefFromSearch("", true, "/quick-scan")).toBe(
      "/quick-scan?quickScanPrivacyDisclosureOpen=1",
    );
    expect(parseQuickScanScopeDisclosureOpenFromSearch("1")).toBe(true);
    expect(quickScanScopeDisclosureHrefFromSearch("step=form", true, "/quick-scan")).toBe(
      "/quick-scan?step=form&quickScanScopeDisclosureOpen=1",
    );
    expect(parseTrustCenterVocabularyOpenFromSearch("true")).toBe(true);
    expect(trustCenterVocabularyDisclosureHrefFromSearch("", true, "/trust")).toBe(
      "/trust?trustCenterVocabularyOpen=1",
    );
    expect(parseAssuranceStatusVocabularyOpenFromSearch("1")).toBe(true);
    expect(assuranceStatusVocabularyDisclosureHrefFromSearch("", true, "/assurance-status")).toBe(
      "/assurance-status?assuranceStatusVocabularyOpen=1",
    );
  });
});

describe("wave83 filter url helpers", () => {
  it("architecture created evidence/findings sources, operator home, tenant settings, projects recycle bin, help baseline/slack integration, compare two reviews, provenance, advisory schedules sources params", async () => {
    const {
      architectureCreatedEvidenceSourcesDisclosureHrefFromSearch,
      parseArchitectureCreatedEvidenceSourcesOpenFromSearch,
    } = await import("@/lib/architecture/architecture-created-evidence-sources-disclosure-url");
    const {
      architectureCreatedFindingsSourcesDisclosureHrefFromSearch,
      parseArchitectureCreatedFindingsSourcesOpenFromSearch,
    } = await import("@/lib/architecture/architecture-created-findings-sources-disclosure-url");
    const {
      operatorHomeSourcesDisclosureHrefFromSearch,
      parseOperatorHomeSourcesOpenFromSearch,
    } = await import("@/lib/operator/operator-home-sources-disclosure-url");
    const {
      parseTenantSettingsSourcesOpenFromSearch,
      tenantSettingsSourcesDisclosureHrefFromSearch,
    } = await import("@/lib/administration/tenant-settings-sources-disclosure-url");
    const {
      parseProjectsRecycleBinSourcesOpenFromSearch,
      projectsRecycleBinSourcesDisclosureHrefFromSearch,
    } = await import("@/lib/administration/projects-recycle-bin-sources-disclosure-url");
    const {
      helpBaselineSettingsSourcesDisclosureHrefFromSearch,
      parseHelpBaselineSettingsSourcesOpenFromSearch,
    } = await import("@/lib/help/help-baseline-settings-sources-disclosure-url");
    const {
      helpSlackIntegrationSourcesDisclosureHrefFromSearch,
      parseHelpSlackIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/help/help-slack-integration-sources-disclosure-url");
    const {
      compareTwoReviewsSourcesDisclosureHrefFromSearch,
      parseCompareTwoReviewsSourcesOpenFromSearch,
    } = await import("@/lib/insights/compare-two-reviews-sources-disclosure-url");
    const {
      parseProvenanceSourcesOpenFromSearch,
      provenanceSourcesDisclosureHrefFromSearch,
    } = await import("@/lib/provenance/provenance-sources-disclosure-url");
    const {
      advisorySchedulesSourcesDisclosureHrefFromSearch,
      parseAdvisorySchedulesSourcesOpenFromSearch,
    } = await import("@/lib/advisory/advisory-schedules-sources-disclosure-url");

    expect(parseArchitectureCreatedEvidenceSourcesOpenFromSearch("1")).toBe(true);
    expect(
      architectureCreatedEvidenceSourcesDisclosureHrefFromSearch(
        "reviewTab=evidence",
        true,
        "/architecture/reviews/r1",
      ),
    ).toBe("/architecture/reviews/r1?reviewTab=evidence&architectureCreatedEvidenceSourcesOpen=1");
    expect(parseArchitectureCreatedFindingsSourcesOpenFromSearch("true")).toBe(true);
    expect(
      architectureCreatedFindingsSourcesDisclosureHrefFromSearch("", true, "/architecture/reviews/r1"),
    ).toBe("/architecture/reviews/r1?architectureCreatedFindingsSourcesOpen=1");
    expect(parseOperatorHomeSourcesOpenFromSearch("1")).toBe(true);
    expect(operatorHomeSourcesDisclosureHrefFromSearch("tab=home", true, "/")).toBe(
      "/?tab=home&operatorHomeSourcesOpen=1",
    );
    expect(parseTenantSettingsSourcesOpenFromSearch("true")).toBe(true);
    expect(tenantSettingsSourcesDisclosureHrefFromSearch("", true, "/administration/workspace-settings")).toBe(
      "/administration/workspace-settings?tenantSettingsSourcesOpen=1",
    );
    expect(parseProjectsRecycleBinSourcesOpenFromSearch("1")).toBe(true);
    expect(
      projectsRecycleBinSourcesDisclosureHrefFromSearch("", true, "/administration/workspace-settings/recycle-bin"),
    ).toBe("/administration/workspace-settings/recycle-bin?projectsRecycleBinSourcesOpen=1");
    expect(parseHelpBaselineSettingsSourcesOpenFromSearch("true")).toBe(true);
    expect(helpBaselineSettingsSourcesDisclosureHrefFromSearch("", true, "/help/baseline-settings")).toBe(
      "/help/baseline-settings?helpBaselineSettingsSourcesOpen=1",
    );
    expect(parseHelpSlackIntegrationSourcesOpenFromSearch("1")).toBe(true);
    expect(helpSlackIntegrationSourcesDisclosureHrefFromSearch("", true, "/help/slack-integration")).toBe(
      "/help/slack-integration?helpSlackIntegrationSourcesOpen=1",
    );
    expect(parseCompareTwoReviewsSourcesOpenFromSearch("true")).toBe(true);
    expect(compareTwoReviewsSourcesDisclosureHrefFromSearch("runA=a", true, "/insights/compare-two-reviews")).toBe(
      "/insights/compare-two-reviews?runA=a&compareTwoReviewsSourcesOpen=1",
    );
    expect(parseProvenanceSourcesOpenFromSearch("1")).toBe(true);
    expect(provenanceSourcesDisclosureHrefFromSearch("", true, "/architecture/reviews/r1/provenance")).toBe(
      "/architecture/reviews/r1/provenance?provenanceSourcesOpen=1",
    );
    expect(parseAdvisorySchedulesSourcesOpenFromSearch("true")).toBe(true);
    expect(advisorySchedulesSourcesDisclosureHrefFromSearch("tab=schedules", true, "/governance/advisory-scans")).toBe(
      "/governance/advisory-scans?tab=schedules&advisorySchedulesSourcesOpen=1",
    );
  });
});

describe("wave84 filter url helpers", () => {
  it("aws/azure/gcp cloud connection, jira/servicenow/slack integration, help cloud connections/connect azure/jira/webhooks sources params", async () => {
    const {
      awsCloudConnectionSourcesDisclosureHrefFromSearch,
      parseAwsCloudConnectionSourcesOpenFromSearch,
    } = await import("@/lib/integrations/aws-cloud-connection-sources-disclosure-url");
    const {
      azureCloudConnectionSourcesDisclosureHrefFromSearch,
      parseAzureCloudConnectionSourcesOpenFromSearch,
    } = await import("@/lib/integrations/azure-cloud-connection-sources-disclosure-url");
    const {
      gcpCloudConnectionSourcesDisclosureHrefFromSearch,
      parseGcpCloudConnectionSourcesOpenFromSearch,
    } = await import("@/lib/integrations/gcp-cloud-connection-sources-disclosure-url");
    const {
      jiraIntegrationSourcesDisclosureHrefFromSearch,
      parseJiraIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/integrations/jira-integration-sources-disclosure-url");
    const {
      parseServicenowIntegrationSourcesOpenFromSearch,
      servicenowIntegrationSourcesDisclosureHrefFromSearch,
    } = await import("@/lib/integrations/servicenow-integration-sources-disclosure-url");
    const {
      parseSlackIntegrationSourcesOpenFromSearch,
      slackIntegrationSourcesDisclosureHrefFromSearch,
    } = await import("@/lib/integrations/slack-integration-sources-disclosure-url");
    const {
      helpCloudConnectionsSourcesDisclosureHrefFromSearch,
      parseHelpCloudConnectionsSourcesOpenFromSearch,
    } = await import("@/lib/help/help-cloud-connections-sources-disclosure-url");
    const {
      helpConnectAzureSecurelySourcesDisclosureHrefFromSearch,
      parseHelpConnectAzureSecurelySourcesOpenFromSearch,
    } = await import("@/lib/help/help-connect-azure-securely-sources-disclosure-url");
    const {
      helpJiraIntegrationSourcesDisclosureHrefFromSearch,
      parseHelpJiraIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/help/help-jira-integration-sources-disclosure-url");
    const {
      helpWebhooksIntegrationSourcesDisclosureHrefFromSearch,
      parseHelpWebhooksIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/help/help-webhooks-integration-sources-disclosure-url");

    expect(parseAwsCloudConnectionSourcesOpenFromSearch("1")).toBe(true);
    expect(
      awsCloudConnectionSourcesDisclosureHrefFromSearch("", true, "/integrations/cloud-connections/aws"),
    ).toBe("/integrations/cloud-connections/aws?awsCloudConnectionSourcesOpen=1");
    expect(parseAzureCloudConnectionSourcesOpenFromSearch("true")).toBe(true);
    expect(
      azureCloudConnectionSourcesDisclosureHrefFromSearch("tab=status", true, "/integrations/cloud-connections/azure"),
    ).toBe("/integrations/cloud-connections/azure?tab=status&azureCloudConnectionSourcesOpen=1");
    expect(parseGcpCloudConnectionSourcesOpenFromSearch("1")).toBe(true);
    expect(
      gcpCloudConnectionSourcesDisclosureHrefFromSearch("", true, "/integrations/cloud-connections/gcp"),
    ).toBe("/integrations/cloud-connections/gcp?gcpCloudConnectionSourcesOpen=1");
    expect(parseJiraIntegrationSourcesOpenFromSearch("true")).toBe(true);
    expect(jiraIntegrationSourcesDisclosureHrefFromSearch("", true, "/integrations/jira")).toBe(
      "/integrations/jira?jiraIntegrationSourcesOpen=1",
    );
    expect(parseServicenowIntegrationSourcesOpenFromSearch("1")).toBe(true);
    expect(servicenowIntegrationSourcesDisclosureHrefFromSearch("", true, "/integrations/servicenow")).toBe(
      "/integrations/servicenow?servicenowIntegrationSourcesOpen=1",
    );
    expect(parseSlackIntegrationSourcesOpenFromSearch("true")).toBe(true);
    expect(slackIntegrationSourcesDisclosureHrefFromSearch("view=channels", true, "/integrations/slack")).toBe(
      "/integrations/slack?view=channels&slackIntegrationSourcesOpen=1",
    );
    expect(parseHelpCloudConnectionsSourcesOpenFromSearch("1")).toBe(true);
    expect(helpCloudConnectionsSourcesDisclosureHrefFromSearch("", true, "/help/cloud-connections")).toBe(
      "/help/cloud-connections?helpCloudConnectionsSourcesOpen=1",
    );
    expect(parseHelpConnectAzureSecurelySourcesOpenFromSearch("true")).toBe(true);
    expect(
      helpConnectAzureSecurelySourcesDisclosureHrefFromSearch("", true, "/help/cloud-connections/azure"),
    ).toBe("/help/cloud-connections/azure?helpConnectAzureSecurelySourcesOpen=1");
    expect(parseHelpJiraIntegrationSourcesOpenFromSearch("1")).toBe(true);
    expect(helpJiraIntegrationSourcesDisclosureHrefFromSearch("", true, "/help/jira-integration")).toBe(
      "/help/jira-integration?helpJiraIntegrationSourcesOpen=1",
    );
    expect(parseHelpWebhooksIntegrationSourcesOpenFromSearch("true")).toBe(true);
    expect(helpWebhooksIntegrationSourcesDisclosureHrefFromSearch("", true, "/help/webhooks-integration")).toBe(
      "/help/webhooks-integration?helpWebhooksIntegrationSourcesOpen=1",
    );
  });
});

describe("wave85 filter url helpers", () => {
  it("help authentication sign-in, core pilot, admin diagnostics, ai usage, procurement, system health, repeat review loop, review guide, alerts, audit trail sources params", async () => {
    const {
      helpAuthenticationSignInSourcesDisclosureHrefFromSearch,
      parseHelpAuthenticationSignInSourcesOpenFromSearch,
    } = await import("@/lib/help/help-authentication-sign-in-sources-disclosure-url");
    const {
      helpCorePilotSourcesDisclosureHrefFromSearch,
      parseHelpCorePilotSourcesOpenFromSearch,
    } = await import("@/lib/help/help-core-pilot-sources-disclosure-url");
    const {
      helpAdminDiagnosticsSourcesDisclosureHrefFromSearch,
      parseHelpAdminDiagnosticsSourcesOpenFromSearch,
    } = await import("@/lib/help/help-admin-diagnostics-sources-disclosure-url");
    const {
      helpAiUsageSourcesDisclosureHrefFromSearch,
      parseHelpAiUsageSourcesOpenFromSearch,
    } = await import("@/lib/help/help-ai-usage-sources-disclosure-url");
    const {
      helpProcurementSourcesDisclosureHrefFromSearch,
      parseHelpProcurementSourcesOpenFromSearch,
    } = await import("@/lib/help/help-procurement-sources-disclosure-url");
    const {
      helpSystemHealthSourcesDisclosureHrefFromSearch,
      parseHelpSystemHealthSourcesOpenFromSearch,
    } = await import("@/lib/help/help-system-health-sources-disclosure-url");
    const {
      helpRepeatReviewLoopSourcesDisclosureHrefFromSearch,
      parseHelpRepeatReviewLoopSourcesOpenFromSearch,
    } = await import("@/lib/help/help-repeat-review-loop-sources-disclosure-url");
    const {
      helpReviewGuideSourcesDisclosureHrefFromSearch,
      parseHelpReviewGuideSourcesOpenFromSearch,
    } = await import("@/lib/help/help-review-guide-sources-disclosure-url");
    const {
      helpAlertsSourcesDisclosureHrefFromSearch,
      parseHelpAlertsSourcesOpenFromSearch,
    } = await import("@/lib/help/help-alerts-sources-disclosure-url");
    const {
      helpAuditTrailSourcesDisclosureHrefFromSearch,
      parseHelpAuditTrailSourcesOpenFromSearch,
    } = await import("@/lib/help/help-audit-trail-sources-disclosure-url");

    expect(parseHelpAuthenticationSignInSourcesOpenFromSearch("1")).toBe(true);
    expect(
      helpAuthenticationSignInSourcesDisclosureHrefFromSearch("", true, "/help/authentication-sign-in"),
    ).toBe("/help/authentication-sign-in?helpAuthenticationSignInSourcesOpen=1");
    expect(parseHelpCorePilotSourcesOpenFromSearch("true")).toBe(true);
    expect(helpCorePilotSourcesDisclosureHrefFromSearch("", true, "/help/first-architecture-review")).toBe(
      "/help/first-architecture-review?helpCorePilotSourcesOpen=1",
    );
    expect(parseHelpAdminDiagnosticsSourcesOpenFromSearch("1")).toBe(true);
    expect(helpAdminDiagnosticsSourcesDisclosureHrefFromSearch("", true, "/help/admin-diagnostics")).toBe(
      "/help/admin-diagnostics?helpAdminDiagnosticsSourcesOpen=1",
    );
    expect(parseHelpAiUsageSourcesOpenFromSearch("true")).toBe(true);
    expect(helpAiUsageSourcesDisclosureHrefFromSearch("tab=usage", true, "/help/ai-usage")).toBe(
      "/help/ai-usage?tab=usage&helpAiUsageSourcesOpen=1",
    );
    expect(parseHelpProcurementSourcesOpenFromSearch("1")).toBe(true);
    expect(helpProcurementSourcesDisclosureHrefFromSearch("", true, "/help/procurement")).toBe(
      "/help/procurement?helpProcurementSourcesOpen=1",
    );
    expect(parseHelpSystemHealthSourcesOpenFromSearch("true")).toBe(true);
    expect(helpSystemHealthSourcesDisclosureHrefFromSearch("", true, "/help/system-health")).toBe(
      "/help/system-health?helpSystemHealthSourcesOpen=1",
    );
    expect(parseHelpRepeatReviewLoopSourcesOpenFromSearch("1")).toBe(true);
    expect(helpRepeatReviewLoopSourcesDisclosureHrefFromSearch("", true, "/help/repeat-review-loop")).toBe(
      "/help/repeat-review-loop?helpRepeatReviewLoopSourcesOpen=1",
    );
    expect(parseHelpReviewGuideSourcesOpenFromSearch("true")).toBe(true);
    expect(helpReviewGuideSourcesDisclosureHrefFromSearch("", true, "/help/review-guide")).toBe(
      "/help/review-guide?helpReviewGuideSourcesOpen=1",
    );
    expect(parseHelpAlertsSourcesOpenFromSearch("1")).toBe(true);
    expect(helpAlertsSourcesDisclosureHrefFromSearch("", true, "/help/alerts")).toBe(
      "/help/alerts?helpAlertsSourcesOpen=1",
    );
    expect(parseHelpAuditTrailSourcesOpenFromSearch("true")).toBe(true);
    expect(helpAuditTrailSourcesDisclosureHrefFromSearch("", true, "/help/audit-trail")).toBe(
      "/help/audit-trail?helpAuditTrailSourcesOpen=1",
    );
  });
});

describe("wave86 filter url helpers", () => {
  it("help notifications, findings, billing and plans, governance approval, decision register, scope, security trust, users and roles, advisory scans, azure boards sources params", async () => {
    const {
      helpNotificationsSourcesDisclosureHrefFromSearch,
      parseHelpNotificationsSourcesOpenFromSearch,
    } = await import("@/lib/help/help-notifications-sources-disclosure-url");
    const {
      helpFindingsSourcesDisclosureHrefFromSearch,
      parseHelpFindingsSourcesOpenFromSearch,
    } = await import("@/lib/help/help-findings-sources-disclosure-url");
    const {
      helpBillingAndPlansSourcesDisclosureHrefFromSearch,
      parseHelpBillingAndPlansSourcesOpenFromSearch,
    } = await import("@/lib/help/help-billing-and-plans-sources-disclosure-url");
    const {
      helpGovernanceApprovalSourcesDisclosureHrefFromSearch,
      parseHelpGovernanceApprovalSourcesOpenFromSearch,
    } = await import("@/lib/help/help-governance-approval-sources-disclosure-url");
    const {
      helpDecisionRegisterSourcesDisclosureHrefFromSearch,
      parseHelpDecisionRegisterSourcesOpenFromSearch,
    } = await import("@/lib/help/help-decision-register-sources-disclosure-url");
    const {
      helpScopeSourcesDisclosureHrefFromSearch,
      parseHelpScopeSourcesOpenFromSearch,
    } = await import("@/lib/help/help-scope-sources-disclosure-url");
    const {
      helpSecurityTrustSourcesDisclosureHrefFromSearch,
      parseHelpSecurityTrustSourcesOpenFromSearch,
    } = await import("@/lib/help/help-security-trust-sources-disclosure-url");
    const {
      helpUsersAndRolesSourcesDisclosureHrefFromSearch,
      parseHelpUsersAndRolesSourcesOpenFromSearch,
    } = await import("@/lib/help/help-users-and-roles-sources-disclosure-url");
    const {
      helpAdvisoryScansSourcesDisclosureHrefFromSearch,
      parseHelpAdvisoryScansSourcesOpenFromSearch,
    } = await import("@/lib/help/help-advisory-scans-sources-disclosure-url");
    const {
      helpAzureBoardsSourcesDisclosureHrefFromSearch,
      parseHelpAzureBoardsSourcesOpenFromSearch,
    } = await import("@/lib/help/help-azure-boards-sources-disclosure-url");

    expect(parseHelpNotificationsSourcesOpenFromSearch("1")).toBe(true);
    expect(helpNotificationsSourcesDisclosureHrefFromSearch("", true, "/help/notifications")).toBe(
      "/help/notifications?helpNotificationsSourcesOpen=1",
    );
    expect(parseHelpFindingsSourcesOpenFromSearch("true")).toBe(true);
    expect(helpFindingsSourcesDisclosureHrefFromSearch("tab=open", true, "/help/findings")).toBe(
      "/help/findings?tab=open&helpFindingsSourcesOpen=1",
    );
    expect(parseHelpBillingAndPlansSourcesOpenFromSearch("1")).toBe(true);
    expect(helpBillingAndPlansSourcesDisclosureHrefFromSearch("", true, "/help/billing-and-plans")).toBe(
      "/help/billing-and-plans?helpBillingAndPlansSourcesOpen=1",
    );
    expect(parseHelpGovernanceApprovalSourcesOpenFromSearch("true")).toBe(true);
    expect(helpGovernanceApprovalSourcesDisclosureHrefFromSearch("", true, "/help/governance-approval")).toBe(
      "/help/governance-approval?helpGovernanceApprovalSourcesOpen=1",
    );
    expect(parseHelpDecisionRegisterSourcesOpenFromSearch("1")).toBe(true);
    expect(helpDecisionRegisterSourcesDisclosureHrefFromSearch("", true, "/help/decision-register")).toBe(
      "/help/decision-register?helpDecisionRegisterSourcesOpen=1",
    );
    expect(parseHelpScopeSourcesOpenFromSearch("true")).toBe(true);
    expect(helpScopeSourcesDisclosureHrefFromSearch("", true, "/help/scope")).toBe(
      "/help/scope?helpScopeSourcesOpen=1",
    );
    expect(parseHelpSecurityTrustSourcesOpenFromSearch("1")).toBe(true);
    expect(helpSecurityTrustSourcesDisclosureHrefFromSearch("", true, "/help/security-trust")).toBe(
      "/help/security-trust?helpSecurityTrustSourcesOpen=1",
    );
    expect(parseHelpUsersAndRolesSourcesOpenFromSearch("true")).toBe(true);
    expect(helpUsersAndRolesSourcesDisclosureHrefFromSearch("", true, "/help/users-and-roles")).toBe(
      "/help/users-and-roles?helpUsersAndRolesSourcesOpen=1",
    );
    expect(parseHelpAdvisoryScansSourcesOpenFromSearch("1")).toBe(true);
    expect(helpAdvisoryScansSourcesDisclosureHrefFromSearch("", true, "/help/advisory-scans")).toBe(
      "/help/advisory-scans?helpAdvisoryScansSourcesOpen=1",
    );
    expect(parseHelpAzureBoardsSourcesOpenFromSearch("true")).toBe(true);
    expect(helpAzureBoardsSourcesDisclosureHrefFromSearch("", true, "/help/azure-boards")).toBe(
      "/help/azure-boards?helpAzureBoardsSourcesOpen=1",
    );
  });
});

describe("wave87 filter url helpers", () => {
  it("help report a problem, roi summary, model governance, architecture scorecard, caiq sig response, accelerator chooser, approval queue, approval lineage, ask review questions, alert rules conditions sources params", async () => {
    const {
      helpReportAProblemSourcesDisclosureHrefFromSearch,
      parseHelpReportAProblemSourcesOpenFromSearch,
    } = await import("@/lib/help/help-report-a-problem-sources-disclosure-url");
    const {
      helpRoiSummarySourcesDisclosureHrefFromSearch,
      parseHelpRoiSummarySourcesOpenFromSearch,
    } = await import("@/lib/help/help-roi-summary-sources-disclosure-url");
    const {
      helpModelGovernanceSourcesDisclosureHrefFromSearch,
      parseHelpModelGovernanceSourcesOpenFromSearch,
    } = await import("@/lib/help/help-model-governance-sources-disclosure-url");
    const {
      helpArchitectureScorecardSourcesDisclosureHrefFromSearch,
      parseHelpArchitectureScorecardSourcesOpenFromSearch,
    } = await import("@/lib/help/help-architecture-scorecard-sources-disclosure-url");
    const {
      helpCaiqSigResponseSourcesDisclosureHrefFromSearch,
      parseHelpCaiqSigResponseSourcesOpenFromSearch,
    } = await import("@/lib/help/help-caiq-sig-response-sources-disclosure-url");
    const {
      helpAcceleratorChooserSourcesDisclosureHrefFromSearch,
      parseHelpAcceleratorChooserSourcesOpenFromSearch,
    } = await import("@/lib/help/help-accelerator-chooser-sources-disclosure-url");
    const {
      approvalQueueSourcesDisclosureHrefFromSearch,
      parseApprovalQueueSourcesOpenFromSearch,
    } = await import("@/lib/governance/approval-queue-sources-disclosure-url");
    const {
      approvalLineageSourcesDisclosureHrefFromSearch,
      parseApprovalLineageSourcesOpenFromSearch,
    } = await import("@/lib/governance/approval-lineage-sources-disclosure-url");
    const {
      askReviewQuestionsSourcesDisclosureHrefFromSearch,
      parseAskReviewQuestionsSourcesOpenFromSearch,
    } = await import("@/lib/insights/ask-review-questions-sources-disclosure-url");
    const {
      alertRulesConditionsSourcesDisclosureHrefFromSearch,
      parseAlertRulesConditionsSourcesOpenFromSearch,
    } = await import("@/lib/alerts/alert-rules-conditions-sources-disclosure-url");

    expect(parseHelpReportAProblemSourcesOpenFromSearch("1")).toBe(true);
    expect(helpReportAProblemSourcesDisclosureHrefFromSearch("", true, "/help/report-a-problem")).toBe(
      "/help/report-a-problem?helpReportAProblemSourcesOpen=1",
    );
    expect(parseHelpRoiSummarySourcesOpenFromSearch("true")).toBe(true);
    expect(helpRoiSummarySourcesDisclosureHrefFromSearch("", true, "/help/roi-summary")).toBe(
      "/help/roi-summary?helpRoiSummarySourcesOpen=1",
    );
    expect(parseHelpModelGovernanceSourcesOpenFromSearch("1")).toBe(true);
    expect(helpModelGovernanceSourcesDisclosureHrefFromSearch("", true, "/help/model-governance")).toBe(
      "/help/model-governance?helpModelGovernanceSourcesOpen=1",
    );
    expect(parseHelpArchitectureScorecardSourcesOpenFromSearch("true")).toBe(true);
    expect(helpArchitectureScorecardSourcesDisclosureHrefFromSearch("", true, "/help/architecture-scorecard")).toBe(
      "/help/architecture-scorecard?helpArchitectureScorecardSourcesOpen=1",
    );
    expect(parseHelpCaiqSigResponseSourcesOpenFromSearch("1")).toBe(true);
    expect(helpCaiqSigResponseSourcesDisclosureHrefFromSearch("", true, "/help/caiq-sig-response")).toBe(
      "/help/caiq-sig-response?helpCaiqSigResponseSourcesOpen=1",
    );
    expect(parseHelpAcceleratorChooserSourcesOpenFromSearch("true")).toBe(true);
    expect(helpAcceleratorChooserSourcesDisclosureHrefFromSearch("", true, "/help/accelerator-chooser")).toBe(
      "/help/accelerator-chooser?helpAcceleratorChooserSourcesOpen=1",
    );
    expect(parseApprovalQueueSourcesOpenFromSearch("1")).toBe(true);
    expect(approvalQueueSourcesDisclosureHrefFromSearch("", true, "/governance/approval-queue")).toBe(
      "/governance/approval-queue?approvalQueueSourcesOpen=1",
    );
    expect(parseApprovalLineageSourcesOpenFromSearch("true")).toBe(true);
    expect(
      approvalLineageSourcesDisclosureHrefFromSearch("", true, "/governance/approval-requests/a1/lineage"),
    ).toBe("/governance/approval-requests/a1/lineage?approvalLineageSourcesOpen=1");
    expect(parseAskReviewQuestionsSourcesOpenFromSearch("1")).toBe(true);
    expect(askReviewQuestionsSourcesDisclosureHrefFromSearch("runId=demo", true, "/insights/ask-review-questions")).toBe(
      "/insights/ask-review-questions?runId=demo&askReviewQuestionsSourcesOpen=1",
    );
    expect(parseAlertRulesConditionsSourcesOpenFromSearch("true")).toBe(true);
    expect(alertRulesConditionsSourcesDisclosureHrefFromSearch("tab=rules", true, "/governance/alert-rules")).toBe(
      "/governance/alert-rules?tab=rules&alertRulesConditionsSourcesOpen=1",
    );
  });
});

describe("wave88 filter url helpers", () => {
  it("slack, servicenow, jira integrations, aws/azure/gcp cloud connections, help webhooks, cloud connections, jira integration, connect azure securely sources params", async () => {
    const {
      slackIntegrationSourcesDisclosureHrefFromSearch,
      parseSlackIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/integrations/slack-integration-sources-disclosure-url");
    const {
      servicenowIntegrationSourcesDisclosureHrefFromSearch,
      parseServicenowIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/integrations/servicenow-integration-sources-disclosure-url");
    const {
      jiraIntegrationSourcesDisclosureHrefFromSearch,
      parseJiraIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/integrations/jira-integration-sources-disclosure-url");
    const {
      awsCloudConnectionSourcesDisclosureHrefFromSearch,
      parseAwsCloudConnectionSourcesOpenFromSearch,
    } = await import("@/lib/integrations/aws-cloud-connection-sources-disclosure-url");
    const {
      azureCloudConnectionSourcesDisclosureHrefFromSearch,
      parseAzureCloudConnectionSourcesOpenFromSearch,
    } = await import("@/lib/integrations/azure-cloud-connection-sources-disclosure-url");
    const {
      gcpCloudConnectionSourcesDisclosureHrefFromSearch,
      parseGcpCloudConnectionSourcesOpenFromSearch,
    } = await import("@/lib/integrations/gcp-cloud-connection-sources-disclosure-url");
    const {
      helpWebhooksIntegrationSourcesDisclosureHrefFromSearch,
      parseHelpWebhooksIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/help/help-webhooks-integration-sources-disclosure-url");
    const {
      helpCloudConnectionsSourcesDisclosureHrefFromSearch,
      parseHelpCloudConnectionsSourcesOpenFromSearch,
    } = await import("@/lib/help/help-cloud-connections-sources-disclosure-url");
    const {
      helpJiraIntegrationSourcesDisclosureHrefFromSearch,
      parseHelpJiraIntegrationSourcesOpenFromSearch,
    } = await import("@/lib/help/help-jira-integration-sources-disclosure-url");
    const {
      helpConnectAzureSecurelySourcesDisclosureHrefFromSearch,
      parseHelpConnectAzureSecurelySourcesOpenFromSearch,
    } = await import("@/lib/help/help-connect-azure-securely-sources-disclosure-url");

    expect(parseSlackIntegrationSourcesOpenFromSearch("1")).toBe(true);
    expect(slackIntegrationSourcesDisclosureHrefFromSearch("", true, "/integrations/slack")).toBe(
      "/integrations/slack?slackIntegrationSourcesOpen=1",
    );
    expect(parseServicenowIntegrationSourcesOpenFromSearch("true")).toBe(true);
    expect(servicenowIntegrationSourcesDisclosureHrefFromSearch("", true, "/integrations/servicenow")).toBe(
      "/integrations/servicenow?servicenowIntegrationSourcesOpen=1",
    );
    expect(parseJiraIntegrationSourcesOpenFromSearch("1")).toBe(true);
    expect(jiraIntegrationSourcesDisclosureHrefFromSearch("", true, "/integrations/jira")).toBe(
      "/integrations/jira?jiraIntegrationSourcesOpen=1",
    );
    expect(parseAwsCloudConnectionSourcesOpenFromSearch("true")).toBe(true);
    expect(awsCloudConnectionSourcesDisclosureHrefFromSearch("", true, "/integrations/cloud-connections/aws")).toBe(
      "/integrations/cloud-connections/aws?awsCloudConnectionSourcesOpen=1",
    );
    expect(parseAzureCloudConnectionSourcesOpenFromSearch("1")).toBe(true);
    expect(azureCloudConnectionSourcesDisclosureHrefFromSearch("", true, "/integrations/cloud-connections/azure")).toBe(
      "/integrations/cloud-connections/azure?azureCloudConnectionSourcesOpen=1",
    );
    expect(parseGcpCloudConnectionSourcesOpenFromSearch("true")).toBe(true);
    expect(gcpCloudConnectionSourcesDisclosureHrefFromSearch("", true, "/integrations/cloud-connections/gcp")).toBe(
      "/integrations/cloud-connections/gcp?gcpCloudConnectionSourcesOpen=1",
    );
    expect(parseHelpWebhooksIntegrationSourcesOpenFromSearch("1")).toBe(true);
    expect(helpWebhooksIntegrationSourcesDisclosureHrefFromSearch("", true, "/help/webhooks-integration")).toBe(
      "/help/webhooks-integration?helpWebhooksIntegrationSourcesOpen=1",
    );
    expect(parseHelpCloudConnectionsSourcesOpenFromSearch("true")).toBe(true);
    expect(helpCloudConnectionsSourcesDisclosureHrefFromSearch("", true, "/help/cloud-connections")).toBe(
      "/help/cloud-connections?helpCloudConnectionsSourcesOpen=1",
    );
    expect(parseHelpJiraIntegrationSourcesOpenFromSearch("1")).toBe(true);
    expect(helpJiraIntegrationSourcesDisclosureHrefFromSearch("", true, "/help/jira-integration")).toBe(
      "/help/jira-integration?helpJiraIntegrationSourcesOpen=1",
    );
    expect(parseHelpConnectAzureSecurelySourcesOpenFromSearch("true")).toBe(true);
    expect(helpConnectAzureSecurelySourcesDisclosureHrefFromSearch("", true, "/help/cloud-connections/azure")).toBe(
      "/help/cloud-connections/azure?helpConnectAzureSecurelySourcesOpen=1",
    );
  });
});

describe("wave89 filter url helpers", () => {
  it("help topic catchall and quick scan sources params", async () => {
    const {
      helpTopicCatchallSourcesDisclosureHrefFromSearch,
      parseHelpTopicCatchallSourcesOpenFromSearch,
    } = await import("@/lib/help/help-topic-catchall-sources-disclosure-url");
    const {
      quickScanSourcesDisclosureHrefFromSearch,
      parseQuickScanSourcesOpenFromSearch,
    } = await import("@/lib/marketing/quick-scan-sources-disclosure-url");

    expect(parseHelpTopicCatchallSourcesOpenFromSearch("1")).toBe(true);
    expect(
      helpTopicCatchallSourcesDisclosureHrefFromSearch("", true, "/help/engineering-troubleshooting"),
    ).toBe("/help/engineering-troubleshooting?helpTopicCatchallSourcesOpen=1");
    expect(parseQuickScanSourcesOpenFromSearch("true")).toBe(true);
    expect(quickScanSourcesDisclosureHrefFromSearch("", true, "/quick-scan")).toBe(
      "/quick-scan?quickScanSourcesOpen=1",
    );
  });
});

describe("wave79 filter url helpers", () => {
  it("dev testing quick switch, operator first-run workflow minimized, run detail workspace disclosures, role nav density, sidebar groups, collapsible json path, finding ask inline finding id, technical id disclosure key, usability feedback, draft intake reason default open params", async () => {
    const {
      devTestingQuickSwitchDisclosureHrefFromSearch,
      parseDevTestingQuickSwitchOpenFromSearch,
    } = await import("@/lib/dev-testing/dev-testing-quick-switch-disclosure-url");
    const {
      operatorFirstRunWorkflowMinimizedDisclosureHrefFromSearch,
      parseOperatorFirstRunWorkflowMinimizedOpenFromSearch,
    } = await import("@/lib/operator/operator-first-run-workflow-minimized-disclosure-url");
    const {
      parseRunDetailWorkspaceDisclosuresExpandedFromSearch,
      runDetailWorkspaceDisclosuresExpandedHrefFromSearch,
    } = await import("@/lib/runs/run-detail-workspace-disclosures-expanded-disclosure-url");
    const {
      parseRoleNavDensityShowFullNavOpenFromSearch,
      roleNavDensityShowFullNavDisclosureHrefFromSearch,
    } = await import("@/lib/sidebar-nav/role-nav-density-show-full-nav-disclosure-url");
    const {
      parseSidebarNavExpandedGroupsFromSearch,
      sidebarNavExpandedGroupsDisclosureHrefFromSearch,
    } = await import("@/lib/sidebar-nav/sidebar-nav-expanded-groups-disclosure-url");
    const {
      collapsibleJsonExpandPathDisclosureHrefFromSearch,
      parseCollapsibleJsonExpandPathFromSearch,
    } = await import("@/lib/collapsible-json-expand-path-disclosure-url");
    const {
      findingAskInlineFindingIdDisclosureHrefFromSearch,
      parseFindingAskInlineFindingIdFromSearch,
    } = await import("@/lib/findings/finding-ask-inline-disclosure-url");
    const {
      parseTechnicalIdDisclosureKeyFromSearch,
      technicalIdDisclosureKeyDisclosureHrefFromSearch,
    } = await import("@/lib/usability/technical-id-disclosure-key-disclosure-url");
    const {
      parseUsabilityFeedbackOpenFromSearch,
      usabilityFeedbackDisclosureHrefFromSearch,
    } = await import("@/lib/usability/usability-feedback-disclosure-url");
    const {
      draftIntakeReasonDefaultOpenDisclosureHrefFromSearch,
      parseDraftIntakeReasonDefaultOpenFromSearch,
    } = await import("@/lib/draft-intake/draft-intake-reason-default-open-disclosure-url");

    expect(parseDevTestingQuickSwitchOpenFromSearch("1")).toBe(true);
    expect(devTestingQuickSwitchDisclosureHrefFromSearch("", true, "/dev-testing")).toBe(
      "/dev-testing?devTestingQuickSwitchOpen=1",
    );
    expect(parseOperatorFirstRunWorkflowMinimizedOpenFromSearch("true")).toBe(true);
    expect(operatorFirstRunWorkflowMinimizedDisclosureHrefFromSearch("tab=home", true, "/operator-home")).toBe(
      "/operator-home?tab=home&operatorFirstRunWorkflowMinimizedOpen=1",
    );
    expect(parseRunDetailWorkspaceDisclosuresExpandedFromSearch("all")).toBe(true);
    expect(parseRunDetailWorkspaceDisclosuresExpandedFromSearch("none")).toBe(false);
    expect(runDetailWorkspaceDisclosuresExpandedHrefFromSearch("view=summary", true, "/architecture/reviews/r1")).toBe(
      "/architecture/reviews/r1?view=summary&runDetailWorkspaceDisclosuresExpanded=1",
    );
    expect(runDetailWorkspaceDisclosuresExpandedHrefFromSearch("view=summary", false, "/architecture/reviews/r1")).toBe(
      "/architecture/reviews/r1?view=summary&runDetailWorkspaceDisclosuresExpanded=0",
    );
    expect(parseRoleNavDensityShowFullNavOpenFromSearch("1")).toBe(true);
    expect(roleNavDensityShowFullNavDisclosureHrefFromSearch("", true, "/operator-home")).toBe(
      "/operator-home?roleNavDensityShowFullNavOpen=1",
    );
    expect(parseSidebarNavExpandedGroupsFromSearch("pilot,operate-analysis")).toEqual(["pilot", "operate-analysis"]);
    expect(
      sidebarNavExpandedGroupsDisclosureHrefFromSearch(
        "density=compact",
        ["pilot", "operate-governance"],
        "/operator-home",
      ),
    ).toBe("/operator-home?density=compact&sidebarNavExpandedGroups=pilot%2Coperate-governance");
    expect(parseCollapsibleJsonExpandPathFromSearch("payload.rule.id")).toBe("payload.rule.id");
    expect(collapsibleJsonExpandPathDisclosureHrefFromSearch("tab=inspect", "payload.rule", "/findings/f1")).toBe(
      "/findings/f1?tab=inspect&collapsibleJsonExpandPath=payload.rule",
    );
    expect(parseFindingAskInlineFindingIdFromSearch("finding-42")).toBe("finding-42");
    expect(findingAskInlineFindingIdDisclosureHrefFromSearch("", "finding-42", "/architecture/reviews/r1/findings")).toBe(
      "/architecture/reviews/r1/findings?findingAskInlineFindingId=finding-42",
    );
    expect(parseTechnicalIdDisclosureKeyFromSearch("architecture-draft-list")).toBe("architecture-draft-list");
    expect(technicalIdDisclosureKeyDisclosureHrefFromSearch("view=table", "draft-row-1", "/architecture/drafts")).toBe(
      "/architecture/drafts?view=table&technicalIdDisclosureKey=draft-row-1",
    );
    expect(parseUsabilityFeedbackOpenFromSearch("true")).toBe(true);
    expect(usabilityFeedbackDisclosureHrefFromSearch("", true, "/operator-home")).toBe(
      "/operator-home?usabilityFeedbackOpen=1",
    );
    expect(parseDraftIntakeReasonDefaultOpenFromSearch("1")).toBe(true);
    expect(draftIntakeReasonDefaultOpenDisclosureHrefFromSearch("step=reason", true, "/architecture/reviews/new")).toBe(
      "/architecture/reviews/new?step=reason&draftIntakeReasonDefaultOpen=1",
    );
  });
});

describe("wave80 filter url helpers", () => {
  it("dev testing quick switch, architecture sponsor sharing, notification preference center relations, identity providers technical details, sso protocol help, settings roles matrix collapsed groups, teams notifications collapsed categories, slack/teams platform notes params", async () => {
    const {
      devTestingQuickSwitchDisclosureHrefFromSearch,
      parseDevTestingQuickSwitchOpenFromSearch,
    } = await import("@/lib/dev-testing/dev-testing-quick-switch-disclosure-url");
    const {
      architectureSponsorSharingDisclosureHrefFromSearch,
      parseArchitectureSponsorSharingOpenFromSearch,
    } = await import("@/lib/architecture/architecture-sponsor-sharing-disclosure-url");
    const {
      notificationPreferenceCenterRelationsDisclosureHrefFromSearch,
      parseNotificationPreferenceCenterRelationsOpenFromSearch,
    } = await import("@/lib/administration/notification-preference-center-relations-disclosure-url");
    const {
      identityProvidersTechnicalDetailsDisclosureHrefFromSearch,
      parseIdentityProvidersTechnicalDetailsOpenFromSearch,
    } = await import("@/lib/administration/identity-providers-technical-details-disclosure-url");
    const {
      parseSsoProtocolHelpOpenFromSearch,
      ssoProtocolHelpDisclosureHrefFromSearch,
    } = await import("@/lib/administration/sso-protocol-help-disclosure-url");
    const {
      parseSettingsRolesMatrixCollapsedGroupsFromSearch,
      settingsRolesMatrixCollapsedGroupsDisclosureHrefFromSearch,
    } = await import("@/lib/administration/settings-roles-matrix-collapsed-groups-disclosure-url");
    const {
      parseTeamsNotificationsCollapsedCategoriesFromSearch,
      teamsNotificationsCollapsedCategoriesDisclosureHrefFromSearch,
    } = await import("@/lib/integrations/teams-notifications-collapsed-categories-disclosure-url");
    const {
      parseSlackPlatformNotesOpenFromSearch,
      slackPlatformNotesDisclosureHrefFromSearch,
    } = await import("@/lib/integrations/slack-platform-notes-disclosure-url");
    const {
      parseTeamsPlatformNotesOpenFromSearch,
      teamsPlatformNotesDisclosureHrefFromSearch,
    } = await import("@/lib/integrations/teams-platform-notes-disclosure-url");

    expect(parseDevTestingQuickSwitchOpenFromSearch("true")).toBe(true);
    expect(devTestingQuickSwitchDisclosureHrefFromSearch("tab=dev", true, "/operator-home")).toBe(
      "/operator-home?tab=dev&devTestingQuickSwitchOpen=1",
    );
    expect(parseArchitectureSponsorSharingOpenFromSearch("1")).toBe(true);
    expect(architectureSponsorSharingDisclosureHrefFromSearch("runId=r1", true, "/architecture/reviews/r1")).toBe(
      "/architecture/reviews/r1?runId=r1&architectureSponsorSharingOpen=1",
    );
    expect(parseNotificationPreferenceCenterRelationsOpenFromSearch("1")).toBe(true);
    expect(notificationPreferenceCenterRelationsDisclosureHrefFromSearch("", true, "/administration/notifications")).toBe(
      "/administration/notifications?notificationPreferenceCenterRelationsOpen=1",
    );
    expect(parseIdentityProvidersTechnicalDetailsOpenFromSearch("true")).toBe(true);
    expect(
      identityProvidersTechnicalDetailsDisclosureHrefFromSearch("", true, "/administration/identity-providers/diagnostics"),
    ).toBe("/administration/identity-providers/diagnostics?identityProvidersTechnicalDetailsOpen=1");
    expect(parseSsoProtocolHelpOpenFromSearch("1")).toBe(true);
    expect(ssoProtocolHelpDisclosureHrefFromSearch("step=protocol", true, "/administration/identity/sso-wizard")).toBe(
      "/administration/identity/sso-wizard?step=protocol&ssoProtocolHelpOpen=1",
    );
    expect(parseSettingsRolesMatrixCollapsedGroupsFromSearch("admin,viewer")).toEqual(["admin", "viewer"]);
    expect(settingsRolesMatrixCollapsedGroupsDisclosureHrefFromSearch("tab=roles", ["admin"], "/administration/users")).toBe(
      "/administration/users?tab=roles&settingsRolesMatrixCollapsedGroups=admin",
    );
    expect(parseTeamsNotificationsCollapsedCategoriesFromSearch("architecture-and-review,governance-and-risk")).toEqual([
      "architecture-and-review",
      "governance-and-risk",
    ]);
    expect(
      teamsNotificationsCollapsedCategoriesDisclosureHrefFromSearch(
        "",
        ["architecture-and-review"],
        "/integrations/teams",
      ),
    ).toBe("/integrations/teams?teamsNotificationsCollapsedCategories=architecture-and-review");
    expect(parseSlackPlatformNotesOpenFromSearch("1")).toBe(true);
    expect(slackPlatformNotesDisclosureHrefFromSearch("", true, "/integrations/slack")).toBe(
      "/integrations/slack?slackPlatformNotesOpen=1",
    );
    expect(parseTeamsPlatformNotesOpenFromSearch("true")).toBe(true);
    expect(teamsPlatformNotesDisclosureHrefFromSearch("view=connect", true, "/integrations/teams")).toBe(
      "/integrations/teams?view=connect&teamsPlatformNotesOpen=1",
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

  it("policy findings nl severity/status and assigned-to-me sort params", async () => {
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
