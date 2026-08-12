import { describe, expect, it } from "vitest";

import { extractMasterTableRows, findTrafficRowById, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  PROJECTS_RECYCLE_BIN_TRAFFIC_NOTE,
  PROJECTS_RECYCLE_BIN_TRAFFIC_PATH,
  PROJECTS_RECYCLE_BIN_TRAFFIC_ROW_ID,
  PROJECTS_RECYCLE_BIN_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-projects-recycle-bin";

describe("ui-route-traffic-projects-recycle-bin (STR)", () => {
  it("tracks Projects recycle bin under Administration with honest access-hub notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = findTrafficRowById(rows, PROJECTS_RECYCLE_BIN_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(PROJECTS_RECYCLE_BIN_TRAFFIC_PATH);
    expect(row?.section).toBe(PROJECTS_RECYCLE_BIN_TRAFFIC_SECTION);
    expect(row?.notes).toBe(PROJECTS_RECYCLE_BIN_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ProjectsRecycleBinPage");
    expect(row?.notes).toContain("Administration");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
