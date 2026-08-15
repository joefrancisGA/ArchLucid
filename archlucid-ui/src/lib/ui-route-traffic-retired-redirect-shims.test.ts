import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";
import { findUiRouteTrafficRow, UI_ROUTE_TRAFFIC_ROWS } from "@/lib/ui-route-traffic/registry";
import {
  REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS,
  RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS,
} from "@/lib/ui-route-traffic-retired-redirect-shims";

describe("ui-route-traffic-retired-redirect-shims", () => {
  it("does not track retired redirect shim rows in the registry or template", () => {
    const templateRows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());

    for (const rowId of REMOVED_REDIRECT_SHIM_TRAFFIC_ROW_IDS) {
      expect(findUiRouteTrafficRow(rowId)).toBeUndefined();
      expect(templateRows.find((row) => row.id === rowId)).toBeUndefined();
    }

    for (const path of RETIRED_REDIRECT_SHIM_TRAFFIC_PATHS) {
      expect(UI_ROUTE_TRAFFIC_ROWS.find((row) => row.path === path)).toBeUndefined();
      expect(templateRows.find((row) => row.path === path)).toBeUndefined();
    }

    expect(templateRows.some((row) => row.section === "Redirect shim")).toBe(false);
  });
});
