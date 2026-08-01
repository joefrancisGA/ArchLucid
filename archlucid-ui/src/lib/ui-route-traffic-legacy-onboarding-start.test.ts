import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  LEGACY_ONBOARDING_START_TRAFFIC_NOTE,
  LEGACY_ONBOARDING_START_TRAFFIC_PATH,
  LEGACY_ONBOARDING_START_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-legacy-onboarding-start";

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

describe("ui-route-traffic-legacy-onboarding-start (TB-1801)", () => {
  it("tracks the legacy onboarding start shim on OSX with honest redirect-only workbook notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = findTrafficRowById(rows, LEGACY_ONBOARDING_START_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(LEGACY_ONBOARDING_START_TRAFFIC_PATH);
    expect(row?.notes).toBe(LEGACY_ONBOARDING_START_TRAFFIC_NOTE);
    expect(row?.notes.toLowerCase()).toContain("redirect");
    expect(row?.notes).toContain("/onboarding");
  });
});
