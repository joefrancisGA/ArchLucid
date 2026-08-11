import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  WELCOME_TRAFFIC_NOTE,
  WELCOME_TRAFFIC_PATH,
  WELCOME_TRAFFIC_ROW_ID,
  WELCOME_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-welcome";

describe("ui-route-traffic-welcome (WXX)", () => {
  it("tracks Welcome with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === WELCOME_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(WELCOME_TRAFFIC_PATH);
    expect(row?.section).toBe(WELCOME_TRAFFIC_SECTION);
    expect(row?.notes).toBe(WELCOME_TRAFFIC_NOTE);
    expect(row?.notes).toContain("WelcomeMarketingPage");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
