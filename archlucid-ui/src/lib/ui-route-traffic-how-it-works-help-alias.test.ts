import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_GETTING_STARTED_HELP_TRAFFIC_PATH_FROM_HOW_IT_WORKS,
  REMOVED_HOW_IT_WORKS_HELP_ALIAS_TRAFFIC_ROW_ID,
  RETIRED_HOW_IT_WORKS_HELP_ALIAS_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-how-it-works-help-alias";

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

describe("ui-route-traffic how-it-works alias retirement (HHX merged into HGX)", () => {
  it("does not track retired HHX; getting started help stays on HGX only", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const hhxRow = rows.find((row) => row.id === REMOVED_HOW_IT_WORKS_HELP_ALIAS_TRAFFIC_ROW_ID);
    const retiredPathRows = rows.filter((row) => row.path === RETIRED_HOW_IT_WORKS_HELP_ALIAS_TRAFFIC_PATH);
    const canonicalRows = rows.filter(
      (row) => row.path === CANONICAL_GETTING_STARTED_HELP_TRAFFIC_PATH_FROM_HOW_IT_WORKS,
    );

    expect(hhxRow).toBeUndefined();
    expect(retiredPathRows).toHaveLength(0);
    expect(canonicalRows).toHaveLength(1);
    expect(canonicalRows[0]?.id).toBe("HGX");
  });
});
