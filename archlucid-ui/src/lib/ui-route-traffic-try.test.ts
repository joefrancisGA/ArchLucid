import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  TRY_TRAFFIC_NOTE,
  TRY_TRAFFIC_PATH,
  TRY_TRAFFIC_ROW_ID,
  TRY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-try";

describe("ui-route-traffic-try (TRY)", () => {
  it("tracks Try with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === TRY_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(TRY_TRAFFIC_PATH);
    expect(row?.section).toBe(TRY_TRAFFIC_SECTION);
    expect(row?.notes).toBe(TRY_TRAFFIC_NOTE);
    expect(row?.notes).toContain("TryPage");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
