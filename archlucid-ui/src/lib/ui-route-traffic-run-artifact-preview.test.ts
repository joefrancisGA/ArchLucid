import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import {
  CANONICAL_SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
  REMOVED_RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID,
  RETIRED_RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-run-artifact-preview";

describe("ui-route-traffic-run-artifact-preview (RER removed)", () => {
  it("does not track RER; artifact Preview stays on GAR", () => {
    const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
    const rerRow = rows.find((row) => row.id === REMOVED_RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH);
    const garRow = rows.find(
      (row) => row.path === CANONICAL_SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
    );

    expect(rerRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(garRow).toBeDefined();
  });
});
