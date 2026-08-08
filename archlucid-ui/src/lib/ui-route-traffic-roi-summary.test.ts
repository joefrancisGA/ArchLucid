import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ROI_SUMMARY_TRAFFIC_NOTE,
  ROI_SUMMARY_TRAFFIC_PATH,
  ROI_SUMMARY_TRAFFIC_ROW_ID,
  ROI_SUMMARY_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-roi-summary";

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

    if (cells.length < 9 || cells[1] === "ID" || cells[1] === "----") {
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

describe("ui-route-traffic-roi-summary (TB-1971)", () => {
  it("tracks SPR with former VRX hit share and no VRX row", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const spr = rows.find((candidate) => candidate.id === ROI_SUMMARY_TRAFFIC_ROW_ID);
    const vrx = rows.find((candidate) => candidate.id === "VRX");

    expect(vrx).toBeUndefined();
    expect(spr).toBeDefined();
    expect(spr?.path).toBe(ROI_SUMMARY_TRAFFIC_PATH);
    expect(spr?.hitPct).toBe("0.12%");
    expect(spr?.section).toBe(ROI_SUMMARY_TRAFFIC_SECTION);
    expect(spr?.notes).toBe(ROI_SUMMARY_TRAFFIC_NOTE);
    expect(spr?.notes).toMatch(/TB-2092|PageContextualHelp|Learn more|claim-discipline/i);
    expect(spr?.notes).toContain("cannot improve further toward 80");
    expect(spr?.notes).toContain("Absorbs former VRX");
    expect(spr?.section.toLowerCase()).not.toBe("marketing");
  });
});
