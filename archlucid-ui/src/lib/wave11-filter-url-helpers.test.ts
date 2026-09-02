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
