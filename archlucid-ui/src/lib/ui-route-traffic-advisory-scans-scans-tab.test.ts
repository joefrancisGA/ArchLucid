import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ADVISORY_SCANS_SCANS_TAB_TRAFFIC_NOTE,
  ADVISORY_SCANS_SCANS_TAB_TRAFFIC_PATH,
  ADVISORY_SCANS_SCANS_TAB_TRAFFIC_ROW_ID,
  ADVISORY_SCANS_SCANS_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-advisory-scans-scans-tab";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

type TrafficWorkbookRow = {
  id: string;
  path: string;
  section: string;
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
      section: cells[7],
      notes: cells[8],
    });
  }

  return rows;
}

describe("ui-route-traffic-advisory-scans-scans-tab (ADT)", () => {
  it("tracks the Scans tab deep link under Tab surface with inherited ADV Evidence notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ADVISORY_SCANS_SCANS_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ADVISORY_SCANS_SCANS_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(ADVISORY_SCANS_SCANS_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ADVISORY_SCANS_SCANS_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 48");
  });
});
