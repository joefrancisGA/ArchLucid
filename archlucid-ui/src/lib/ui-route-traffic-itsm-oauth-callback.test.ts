import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ITSM_OAUTH_CALLBACK_TRAFFIC_NOTE,
  ITSM_OAUTH_CALLBACK_TRAFFIC_PATH,
  ITSM_OAUTH_CALLBACK_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-itsm-oauth-callback";

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
      id: cells[1],
      path: cells[2].replace(/^`|`$/g, ""),
      notes: cells[8],
    });
  }

  return rows;
}

function findTrafficRowById(rows: TrafficWorkbookRow[], rowId: string): TrafficWorkbookRow | undefined {
  return rows.find((row) => row.id === rowId);
}

describe("ui-route-traffic-itsm-oauth-callback (TB-1781)", () => {
  it("tracks the OAuth callback on IIO with honest workbook notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = findTrafficRowById(rows, ITSM_OAUTH_CALLBACK_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ITSM_OAUTH_CALLBACK_TRAFFIC_PATH);
    expect(row?.notes).toBe(ITSM_OAUTH_CALLBACK_TRAFFIC_NOTE);
    expect(row?.notes.toLowerCase()).not.toContain("blocked-by-redirect");
    expect(row?.notes.toLowerCase()).not.toContain("blocked by redirect");
  });
});
