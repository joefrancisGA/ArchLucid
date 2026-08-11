import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
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
});
