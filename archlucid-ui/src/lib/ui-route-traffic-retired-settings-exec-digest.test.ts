import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_EXEC_DIGEST_SCHEDULE_TRAFFIC_PATH,
  REMOVED_SETTINGS_EXEC_DIGEST_LEGACY_TRAFFIC_ROW_ID,
  REMOVED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID,
  RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-retired-settings-exec-digest";

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

describe("ui-route-traffic-retired-settings-exec-digest (EEX removed)", () => {
  it("does not track retired EEX; Digests Schedule stays on DIS", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const eexRow = rows.find((row) => row.id === REMOVED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID);
    const sexRow = rows.find((row) => row.id === REMOVED_SETTINGS_EXEC_DIGEST_LEGACY_TRAFFIC_ROW_ID);
    const disRow = rows.find((row) => row.id === "DIS");
    const retiredPathRow = rows.find((row) => row.path === RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_PATH);

    expect(eexRow).toBeUndefined();
    expect(sexRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(disRow?.path).toBe(CANONICAL_EXEC_DIGEST_SCHEDULE_TRAFFIC_PATH);
    expect(disRow?.notes.toLowerCase()).not.toContain("eex");
    expect(disRow?.notes.toLowerCase()).not.toContain("sex");
    expect(disRow?.notes.toLowerCase()).not.toContain("/settings/exec-digest");
  });
});
