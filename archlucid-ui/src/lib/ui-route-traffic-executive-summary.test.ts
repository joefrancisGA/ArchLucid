import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EXECUTIVE_SUMMARY_TRAFFIC_NOTE,
  EXECUTIVE_SUMMARY_TRAFFIC_PATH,
  EXECUTIVE_SUMMARY_TRAFFIC_ROW_ID,
  EXECUTIVE_SUMMARY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-executive-summary";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

type TrafficWorkbookRow = {
  id: string;
  path: string;
  hitPct: string;
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
      hitPct: cells[3] ?? "",
      section: cells[7] ?? "",
      notes: cells[8] ?? "",
    });
  }

  return rows;
}

describe("ui-route-traffic-executive-summary (TB-1961)", () => {
  it("tracks SPE with former VXX hit share and no VXX row", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const spe = rows.find((candidate) => candidate.id === EXECUTIVE_SUMMARY_TRAFFIC_ROW_ID);
    const vxx = rows.find((candidate) => candidate.id === "VXX");

    expect(vxx).toBeUndefined();
    expect(spe).toBeDefined();
    expect(spe?.path).toBe(EXECUTIVE_SUMMARY_TRAFFIC_PATH);
    expect(spe?.hitPct).toBe("0.22%");
    expect(spe?.section).toBe(EXECUTIVE_SUMMARY_TRAFFIC_SECTION);
    expect(spe?.notes).toBe(EXECUTIVE_SUMMARY_TRAFFIC_NOTE);
    expect(spe?.notes).toContain("Absorbs former VXX");
    expect(spe?.notes).toContain("Sources");
    expect(spe?.notes).toContain("ValueReportPageClient");
    expect(spe?.section.toLowerCase()).not.toBe("marketing");
  });
});
