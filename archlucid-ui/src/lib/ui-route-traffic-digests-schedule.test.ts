import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  DIGESTS_SCHEDULE_TRAFFIC_NOTE,
  DIGESTS_SCHEDULE_TRAFFIC_PATH,
  DIGESTS_SCHEDULE_TRAFFIC_ROW_ID,
  DIGESTS_SCHEDULE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-digests-schedule";

describe("ui-route-traffic-digests-schedule (ARS)", () => {
  it("tracks Digests Schedule with honest workbook notes and no SEX row", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === DIGESTS_SCHEDULE_TRAFFIC_ROW_ID);
    const sexRow = rows.find((candidate) => candidate.id === "SEX");

    expect(sexRow).toBeUndefined();
    expect(row).toBeDefined();
    expect(row?.path).toBe(DIGESTS_SCHEDULE_TRAFFIC_PATH);
    expect(row?.section).toBe(DIGESTS_SCHEDULE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DIGESTS_SCHEDULE_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes.toLowerCase()).not.toContain("/settings/exec-digest");
  });
});
