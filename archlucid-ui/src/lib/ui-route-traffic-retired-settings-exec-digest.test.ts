import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_EXEC_DIGEST_SCHEDULE_TRAFFIC_PATH,
  REMOVED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID,
  RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_NOTE,
  RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_PATH,
  RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID,
  RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-retired-settings-exec-digest";

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

describe("ui-route-traffic-retired-settings-exec-digest (EEX)", () => {
  it("tracks the retired settings bookmark with honest workbook notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const eexRow = findTrafficRowById(rows, RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID);
    const disRow = findTrafficRowById(rows, "DIS");
    const sexRow = findTrafficRowById(rows, REMOVED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID);

    expect(sexRow).toBeUndefined();
    expect(eexRow).toBeDefined();
    expect(eexRow?.path).toBe(RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_PATH);
    expect(eexRow?.section).toBe(RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_SECTION);
    expect(eexRow?.notes).toBe(RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_NOTE);
    expect(eexRow?.notes).toContain("SEX");
    expect(eexRow?.notes).toContain("DIS");
    expect(disRow?.path).toBe(CANONICAL_EXEC_DIGEST_SCHEDULE_TRAFFIC_PATH);
    expect(disRow?.notes.toLowerCase()).not.toContain("sex");
  });
});
