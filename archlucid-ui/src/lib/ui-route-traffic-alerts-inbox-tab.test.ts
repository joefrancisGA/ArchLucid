import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_ALERTS_INBOX_TRAFFIC_PATH,
  REMOVED_ALERTS_INBOX_TAB_TRAFFIC_ROW_ID,
  RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-alerts-inbox-tab";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

type TrafficWorkbookRow = {
  id: string;
  path: string;
  notes: string;
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
      notes: cells[8] ?? "",
    });
  }

  return rows;
}

describe("ui-route-traffic-alerts-inbox-tab (GOI removed)", () => {
  it("does not track retired GOI; inbox stays on AL", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const goiRow = rows.find((row) => row.id === REMOVED_ALERTS_INBOX_TAB_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH);
    const alRow = rows.find((row) => row.path === CANONICAL_ALERTS_INBOX_TRAFFIC_PATH);

    expect(goiRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(alRow).toBeDefined();
    expect(alRow?.notes.toLowerCase()).not.toContain("tab=inbox");
  });
});
