import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  FLEET_LLM_COGS_TRAFFIC_NOTE,
  FLEET_LLM_COGS_TRAFFIC_PATH,
  FLEET_LLM_COGS_TRAFFIC_ROW_ID,
  FLEET_LLM_COGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-fleet-llm-cogs";

describe("ui-route-traffic-fleet-llm-cogs (AFX)", () => {
  it("tracks the fleet LLM COGS admin dashboard with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, FLEET_LLM_COGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(FLEET_LLM_COGS_TRAFFIC_PATH);
    expect(row?.section).toBe(FLEET_LLM_COGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(FLEET_LLM_COGS_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("FleetLlmCogsAdminPageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
