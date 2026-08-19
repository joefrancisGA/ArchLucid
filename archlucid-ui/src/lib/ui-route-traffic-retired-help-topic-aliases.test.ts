import { describe, expect, it } from "vitest";

import { extractMasterTableRows, readUiRouteTrafficEstimatesTemplateMarkdown } from "@/lib/testing/ui-route-traffic-workbook-test-utils";

import { RETIRED_HELP_TOPIC_ALIAS_TRAFFIC_ENTRIES } from "@/lib/ui-route-traffic-retired-help-topic-aliases";

function trafficWorkbookPath(path: string): string {
  const hashIndex = path.indexOf("#");

  if (hashIndex >= 0) {
    return path.slice(0, hashIndex);
  }

  return path;
}

describe("ui-route-traffic retired help topic aliases (Batch E manifest)", () => {
  it.each(RETIRED_HELP_TOPIC_ALIAS_TRAFFIC_ENTRIES.map((entry) => [entry.removedRowId, entry] as const))(
    "does not track retired row %s; canonical path remains scored once",
    (_rowId, entry) => {
      const rows = extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
      const removedRow = rows.find((row) => row.id === entry.removedRowId);
      const retiredPathRows = rows.filter((row) => row.path === entry.retiredPath);
      const canonicalRows = rows.filter((row) => row.path === trafficWorkbookPath(entry.canonicalPath));

      expect(removedRow).toBeUndefined();
      expect(retiredPathRows).toHaveLength(0);
      expect(canonicalRows.length).toBeGreaterThanOrEqual(1);
    },
  );
});
