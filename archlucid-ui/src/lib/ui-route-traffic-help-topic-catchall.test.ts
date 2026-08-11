import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  HELP_TOPIC_CATCHALL_TRAFFIC_NOTE,
  HELP_TOPIC_CATCHALL_TRAFFIC_PATH,
  HELP_TOPIC_CATCHALL_TRAFFIC_ROW_ID,
  HELP_TOPIC_CATCHALL_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-help-topic-catchall";

describe("ui-route-traffic-help-topic-catchall (HE.)", () => {
  it("tracks the help catch-all with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === HELP_TOPIC_CATCHALL_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(HELP_TOPIC_CATCHALL_TRAFFIC_PATH);
    expect(row?.section).toBe(HELP_TOPIC_CATCHALL_TRAFFIC_SECTION);
    expect(row?.notes).toBe(HELP_TOPIC_CATCHALL_TRAFFIC_NOTE);
    expect(row?.notes).toContain("PageContextualHelpButton");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
