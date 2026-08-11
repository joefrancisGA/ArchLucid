import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  SEARCH_REVIEW_EVIDENCE_TRAFFIC_NOTE,
  SEARCH_REVIEW_EVIDENCE_TRAFFIC_PATH,
  SEARCH_REVIEW_EVIDENCE_TRAFFIC_ROW_ID,
  SEARCH_REVIEW_EVIDENCE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-search-review-evidence";

describe("ui-route-traffic-search-review-evidence (SXX)", () => {
  it("tracks Search review evidence under Marketing with discovery launcher Evidence notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === SEARCH_REVIEW_EVIDENCE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SEARCH_REVIEW_EVIDENCE_TRAFFIC_PATH);
    expect(row?.section).toBe(SEARCH_REVIEW_EVIDENCE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SEARCH_REVIEW_EVIDENCE_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
