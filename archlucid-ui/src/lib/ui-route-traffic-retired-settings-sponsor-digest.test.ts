import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CANONICAL_EXEC_DIGEST_SCHEDULE_TRAFFIC_PATH,
  REMOVED_SETTINGS_EXEC_DIGEST_LEGACY_TRAFFIC_ROW_ID,
  REMOVED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID,
  RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-retired-settings-sponsor-digest";
import { DIGESTS_SCHEDULE_TRAFFIC_ROW_ID } from "@/lib/ui-route-traffic-digests-schedule";

describe("ui-route-traffic-retired-settings-sponsor-digest (EEX removed)", () => {
  it("does not track retired EEX; Digests Schedule stays on ARS", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const eexRow = rows.find((row) => row.id === REMOVED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID);
    const sexRow = rows.find((row) => row.id === REMOVED_SETTINGS_EXEC_DIGEST_LEGACY_TRAFFIC_ROW_ID);
    const scheduleRow = rows.find((row) => row.id === DIGESTS_SCHEDULE_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_PATH);

    expect(eexRow).toBeUndefined();
    expect(sexRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(scheduleRow?.path).toBe(CANONICAL_EXEC_DIGEST_SCHEDULE_TRAFFIC_PATH);
    expect(scheduleRow?.notes.toLowerCase()).not.toContain("eex");
    expect(scheduleRow?.notes.toLowerCase()).not.toContain("sex");
    expect(scheduleRow?.notes.toLowerCase()).not.toContain("/settings/sponsor-digest");
  });
});
