import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DIGESTS_HELP_TRAFFIC_NOTE,
  DIGESTS_HELP_TRAFFIC_PATH,
  DIGESTS_HELP_TRAFFIC_ROW_ID,
  DIGESTS_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-digests-help";

describe("ui-route-traffic-digests-help (HDG)", () => {
  it("tracks Digests help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DIGESTS_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DIGESTS_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(DIGESTS_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DIGESTS_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpDigestsGuideView");
    expect(row?.notes).toContain("Score 58");
    expect(rows.find((candidate) => candidate.id === "HDI")).toBeUndefined();
  });
});
