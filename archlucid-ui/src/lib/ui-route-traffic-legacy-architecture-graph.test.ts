import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { findUiRouteTrafficRow } from "@/lib/ui-route-traffic/registry";
import {
  LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_NOTE,
  LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_PATH,
  LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-legacy-architecture-graph";

describe("ui-route-traffic legacy architecture-graph (TB-1806)", () => {
  it("tracks OAX as a redirect-only workbook row", () => {
    const registryRow = findUiRouteTrafficRow(LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_ROW_ID);
    const templateRow = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown()).find(
      (row) => row.id === LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_ROW_ID,
    );

    expect(registryRow?.path).toBe(LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_PATH);
    expect(registryRow?.section).toBe("Redirect shim");
    expect(registryRow?.note).toBe(LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_NOTE);
    expect(templateRow?.path).toBe(LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_PATH);
    expect(templateRow?.section).toBe("Redirect shim");
    expect(templateRow?.notes).toBe(LEGACY_ARCHITECTURE_GRAPH_TRAFFIC_NOTE);
    expect(templateRow?.notes.toLowerCase()).toContain("legacy");
    expect(templateRow?.notes).toContain("/insights/evidence-graph");
    expect(templateRow?.notes).not.toMatch(/pagecontextualhelp/i);
  });
});
