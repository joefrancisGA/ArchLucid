import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  OPERATOR_HOME_TRAFFIC_NOTE,
  OPERATOR_HOME_TRAFFIC_PATH,
  OPERATOR_HOME_TRAFFIC_ROW_ID,
  OPERATOR_HOME_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-operator-home";

describe("ui-route-traffic-operator-home (HOM)", () => {
  it("tracks Overview home with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === OPERATOR_HOME_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(OPERATOR_HOME_TRAFFIC_PATH);
    expect(row?.section).toBe(OPERATOR_HOME_TRAFFIC_SECTION);
    expect(row?.notes).toBe(OPERATOR_HOME_TRAFFIC_NOTE);
    expect(row?.notes).toContain("OperatorHomePageChrome");
    expect(row?.notes).toContain("PageContextualHelp");
    
    expect(row?.notes).toContain("Score 72");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
