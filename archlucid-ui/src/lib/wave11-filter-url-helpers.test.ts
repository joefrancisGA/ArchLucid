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
