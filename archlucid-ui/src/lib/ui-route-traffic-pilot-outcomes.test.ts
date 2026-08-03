import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  PILOT_OUTCOMES_TRAFFIC_NOTE,
  PILOT_OUTCOMES_TRAFFIC_PATH,
  PILOT_OUTCOMES_TRAFFIC_ROW_ID,
  PILOT_OUTCOMES_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-pilot-outcomes";

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

describe("ui-route-traffic-pilot-outcomes (TB-1966)", () => {
  it("tracks SPP with former VPX hit share and no VPX row", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const spp = rows.find((candidate) => candidate.id === PILOT_OUTCOMES_TRAFFIC_ROW_ID);
    const vpx = rows.find((candidate) => candidate.id === "VPX");

    expect(vpx).toBeUndefined();
    expect(spp).toBeDefined();
    expect(spp?.path).toBe(PILOT_OUTCOMES_TRAFFIC_PATH);
    expect(spp?.hitPct).toBe("0.07%");
    expect(spp?.section).toBe(PILOT_OUTCOMES_TRAFFIC_SECTION);
    expect(spp?.notes).toBe(PILOT_OUTCOMES_TRAFFIC_NOTE);
    expect(spp?.notes).toContain("Absorbs former VPX");
    expect(spp?.section.toLowerCase()).not.toBe("marketing");
  });
});
