import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  RUN_PROVENANCE_TRAFFIC_NOTE,
  RUN_PROVENANCE_TRAFFIC_PATH,
  RUN_PROVENANCE_TRAFFIC_ROW_ID,
  RUN_PROVENANCE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-run-provenance";

describe("ui-route-traffic-run-provenance (RRP)", () => {
  it("tracks run provenance under Core review with honest workbook notes", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === RUN_PROVENANCE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(RUN_PROVENANCE_TRAFFIC_PATH);
    expect(row?.section).toBe(RUN_PROVENANCE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(RUN_PROVENANCE_TRAFFIC_NOTE);
    expect(row?.notes).toContain("ProvenancePageWorkspace");
    expect(row?.notes).toContain("Score 68");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
