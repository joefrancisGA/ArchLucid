import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  extractUiRouteTrafficWorkbookRowFromModule,
  loadUiRouteTrafficMasterTableRows,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";

describe("ui-route-traffic-workbook-test-utils", () => {
  it("reads the owner traffic workbook template from the repo root", () => {
    const markdown = readUiRouteTrafficEstimatesTemplateMarkdown();

    expect(markdown).toContain("## Master table");
    expect(markdown).toContain("| ID |");
  });

  it("extracts master table rows with id, path, section, and notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    expect(rows.length).toBeGreaterThan(100);
    expect(rows.every((row) => row.id.length > 0)).toBe(true);
    expect(rows.every((row) => row.path.length > 0)).toBe(true);
  });

  it("loads master table rows in one call", () => {
    expect(loadUiRouteTrafficMasterTableRows().length).toBeGreaterThan(100);
  });

  it("extracts the standard four workbook exports from a module namespace", () => {
    const moduleRow = extractUiRouteTrafficWorkbookRowFromModule("ui-route-traffic-governance-findings.ts", {
      GOVERNANCE_FINDINGS_TRAFFIC_ROW_ID: "GFN",
      GOVERNANCE_FINDINGS_TRAFFIC_PATH: "/governance/findings",
      GOVERNANCE_FINDINGS_TRAFFIC_SECTION: "Alerts/gov",
      GOVERNANCE_FINDINGS_TRAFFIC_NOTE: "Findings queue",
    });

    expect(moduleRow).toEqual({
      modulePath: "ui-route-traffic-governance-findings.ts",
      rowId: "GFN",
      path: "/governance/findings",
      section: "Alerts/gov",
      note: "Findings queue",
    });
  });
});
