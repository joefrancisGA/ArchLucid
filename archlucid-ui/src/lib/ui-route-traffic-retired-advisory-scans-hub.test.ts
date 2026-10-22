import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CANONICAL_ADVISORY_SCANS_DEFAULT_TAB_TRAFFIC_PATH,
  REMOVED_ADVISORY_SCANS_HUB_TRAFFIC_ROW_ID,
  RETIRED_ADVISORY_SCANS_HUB_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-retired-advisory-scans-hub";

describe("ui-route-traffic advisory scans hub retirement", () => {
  it("does not track retired ADV; default Scans tab stays on ADT", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const advRow = rows.find((row) => row.id === REMOVED_ADVISORY_SCANS_HUB_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_ADVISORY_SCANS_HUB_TRAFFIC_PATH);
    const adtRow = rows.find((row) => row.path === CANONICAL_ADVISORY_SCANS_DEFAULT_TAB_TRAFFIC_PATH);

    expect(advRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(adtRow).toBeDefined();
    expect(adtRow?.notes.toLowerCase()).not.toContain("sibling adv = hub");
  });
});
