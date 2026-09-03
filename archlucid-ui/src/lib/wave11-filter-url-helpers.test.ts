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
