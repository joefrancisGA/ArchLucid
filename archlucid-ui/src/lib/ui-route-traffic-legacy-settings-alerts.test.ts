import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

/** Retired traffic row — Alert rules hub is scored on SAX (GOA is approval-queue). */
const RETIRED_SETTINGS_ALERTS_TRAFFIC_ROW_ID = "SEL";

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

describe("ui-route-traffic settings alerts retirement (TB-1886)", () => {
  it("keeps retired SEL bookmark; Alert rules hub stays on SAX", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const selRow = rows.find((row) => row.id === RETIRED_SETTINGS_ALERTS_TRAFFIC_ROW_ID);
    const saxRow = rows.find((row) => row.id === "SAX");

    // Next.config-only bookmark kept in the owner traffic workbook (TRAFFIC_TRACKED_REDIRECT_BOOKMARKS).
    expect(selRow?.path).toBe("/settings/alerts");
    expect(saxRow?.path).toBe("/governance/alert-rules");
  });
});
