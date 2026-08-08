import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  IMPACT_PREVIEW_TRAFFIC_NOTE,
  IMPACT_PREVIEW_TRAFFIC_PATH,
  IMPACT_PREVIEW_TRAFFIC_ROW_ID,
  IMPACT_PREVIEW_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-impact-preview";

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
      id: cells[1] ?? "",
      path: (cells[2] ?? "").replace(/^`|`$/g, ""),
      section: cells[7] ?? "",
      notes: cells[8] ?? "",
    });
  }

  return rows;
}

describe("ui-route-traffic-impact-preview (INI)", () => {
  it("tracks impact-preview with honest workbook notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === IMPACT_PREVIEW_TRAFFIC_ROW_ID);
    const exx = rows.find((candidate) => candidate.id === "EXX");

    expect(exx).toBeUndefined();
    expect(row).toBeDefined();
    expect(row?.path).toBe(IMPACT_PREVIEW_TRAFFIC_PATH);
    expect(row?.section).toBe(IMPACT_PREVIEW_TRAFFIC_SECTION);
    expect(row?.notes).toBe(IMPACT_PREVIEW_TRAFFIC_NOTE);
    expect(row?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(row?.notes).toContain("Score 52");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
