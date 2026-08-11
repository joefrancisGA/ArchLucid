import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  REVIEW_PACKAGES_HELP_TRAFFIC_NOTE,
  REVIEW_PACKAGES_HELP_TRAFFIC_PATH,
  REVIEW_PACKAGES_HELP_TRAFFIC_ROW_ID,
  REVIEW_PACKAGES_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-review-packages-help";

describe("ui-route-traffic-review-packages-help (REV)", () => {
  it("tracks review-packages help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === REVIEW_PACKAGES_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(REVIEW_PACKAGES_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(REVIEW_PACKAGES_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(REVIEW_PACKAGES_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpReviewPackagesGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
