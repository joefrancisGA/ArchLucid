import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { RETIRED_HELP_TOPIC_ALIAS_TRAFFIC_ENTRIES } from "@/lib/ui-route-traffic-retired-help-topic-aliases";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

type TrafficWorkbookRow = {
  id: string;
  path: string;
};

function readTemplateMarkdown(): string {
  return readFileSync(join(process.cwd(), "..", TEMPLATE_PATH), "utf8");
}

function extractMasterTableRows(markdown: string): TrafficWorkbookRow[] {
  const marker = "## Master table";
  const start = markdown.indexOf(marker);

  if (start < 0) {
    throw new Error(`Missing master table in ${TEMPLATE_PATH}`);
  }

  const rows: TrafficWorkbookRow[] = [];

  for (const line of markdown.slice(start).split("\n")) {
    if (!line.startsWith("|")) {
      continue;
    }

    const cells = line.split("|").map((cell) => cell.trim());

    if (cells.length < 9 || cells[1] === "ID") {
      continue;
    }

    rows.push({
      id: cells[1] ?? "",
      path: (cells[2] ?? "").replace(/^`|`$/g, ""),
    });
  }

  return rows;
}

describe("ui-route-traffic retired help topic aliases (Batch E manifest)", () => {
  it.each(RETIRED_HELP_TOPIC_ALIAS_TRAFFIC_ENTRIES.map((entry) => [entry.removedRowId, entry] as const))(
    "does not track retired row %s; canonical path remains scored once",
    (_rowId, entry) => {
      const rows = extractMasterTableRows(readTemplateMarkdown());
      const removedRow = rows.find((row) => row.id === entry.removedRowId);
      const retiredPathRows = rows.filter((row) => row.path === entry.retiredPath);
      const canonicalRows = rows.filter((row) => row.path === entry.canonicalPath);

      expect(removedRow).toBeUndefined();
      expect(retiredPathRows).toHaveLength(0);
      expect(canonicalRows.length).toBeGreaterThanOrEqual(1);
    },
  );
});
