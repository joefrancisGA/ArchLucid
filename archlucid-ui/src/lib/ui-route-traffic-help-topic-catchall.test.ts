import { describe, expect, it } from "vitest";

import {
  extractMasterTableRows,
  findTrafficRowById,
  readUiRouteTrafficEstimatesTemplateMarkdown,
} from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";
import {
  HELP_TOPIC_CATCHALL_TRAFFIC_NOTE,
  HELP_TOPIC_CATCHALL_TRAFFIC_PATH,
  HELP_TOPIC_CATCHALL_TRAFFIC_ROW_ID,
  HELP_TOPIC_CATCHALL_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-help-topic-catchall";

describe("ui-route-traffic-help-topic-catchall (HE. / TB-1602)", () => {
  it("tracks catch-all as Router meta with per-slug scoring honesty in registry + template", () => {
    const registryRow = findUiRouteTrafficRow(HELP_TOPIC_CATCHALL_TRAFFIC_ROW_ID);

    expect(registryRow).toBeDefined();
    expect(registryRow?.path).toBe(HELP_TOPIC_CATCHALL_TRAFFIC_PATH);
    expect(registryRow?.section).toBe(HELP_TOPIC_CATCHALL_TRAFFIC_SECTION);
    expect(registryRow?.note).toBe(HELP_TOPIC_CATCHALL_TRAFFIC_NOTE);
    expect(registryRow?.note).toContain("not a standalone buyer URL");
    expect(registryRow?.note).toContain("Per-slug help workbook rows");
    expect(registryRow?.note).not.toContain("Score 58");

    const templateRow = findTrafficRowById(
      extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown()),
      HELP_TOPIC_CATCHALL_TRAFFIC_ROW_ID,
    );

    expect(templateRow).toBeDefined();
    expect(templateRow?.section).toBe(HELP_TOPIC_CATCHALL_TRAFFIC_SECTION);
    expect(templateRow?.notes).toBe(HELP_TOPIC_CATCHALL_TRAFFIC_NOTE);
  });
});
