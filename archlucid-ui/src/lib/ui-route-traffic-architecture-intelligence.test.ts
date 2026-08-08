import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ARCHITECTURE_INTELLIGENCE_TRAFFIC_NOTE,
  ARCHITECTURE_INTELLIGENCE_TRAFFIC_PATH,
  ARCHITECTURE_INTELLIGENCE_TRAFFIC_ROW_ID,
  ARCHITECTURE_INTELLIGENCE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-architecture-intelligence";

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

function findTrafficRowById(rows: TrafficWorkbookRow[], rowId: string): TrafficWorkbookRow | undefined {
  return rows.find((row) => row.id === rowId);
}

describe("ui-route-traffic-architecture-intelligence (AR2 / AIN)", () => {
  it("tracks Architecture intelligence under Core review with honest operator-surface notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = findTrafficRowById(rows, ARCHITECTURE_INTELLIGENCE_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ARCHITECTURE_INTELLIGENCE_TRAFFIC_PATH);
    expect(row?.section).toBe(ARCHITECTURE_INTELLIGENCE_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ARCHITECTURE_INTELLIGENCE_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes).toContain("ArchitectureIntelligencePageClient");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
