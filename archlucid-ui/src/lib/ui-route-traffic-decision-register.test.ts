import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DECISION_REGISTER_TRAFFIC_NOTE,
  DECISION_REGISTER_TRAFFIC_PATH,
  DECISION_REGISTER_TRAFFIC_ROW_ID,
  DECISION_REGISTER_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-decision-register";

describe("ui-route-traffic-decision-register (GDO)", () => {
  it("tracks Decision register with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DECISION_REGISTER_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DECISION_REGISTER_TRAFFIC_PATH);
    expect(row?.section).toBe(DECISION_REGISTER_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DECISION_REGISTER_TRAFFIC_NOTE);
    expect(row?.notes).toContain("DecisionRegisterClient");
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
