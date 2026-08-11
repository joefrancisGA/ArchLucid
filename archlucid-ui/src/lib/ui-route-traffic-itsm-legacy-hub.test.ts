import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

describe("ui-route-traffic removed ITSM hub (pre-release cleanup)", () => {
  it("drops the IIX legacy ITSM hub row from the traffic workbook", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(rows.find((row) => row.id === "IIX")).toBeUndefined();
    expect(rows.some((row) => row.path === "/integrations/itsm")).toBe(false);
  });

  it("tracks Connection status on ADC with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((entry) => entry.id === "ADC");

    expect(row?.path).toBe("/administration/connection-status");
    expect(row?.notes).toContain("ConnectorOperationsDashboard");
  });
});
