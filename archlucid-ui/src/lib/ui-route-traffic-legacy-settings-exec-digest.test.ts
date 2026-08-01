import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

/** Retired traffic row — Digests Schedule is scored only on DIS. */
const RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID = "SEX";

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

describe("ui-route-traffic settings exec-digest retirement (TB-1901)", () => {
  it("does not track retired SEX; Digests Schedule stays on DIS", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const sexRow = rows.find((row) => row.id === RETIRED_SETTINGS_EXEC_DIGEST_TRAFFIC_ROW_ID);
    const disRow = rows.find((row) => row.id === "DIS");

    expect(sexRow).toBeUndefined();
    expect(disRow?.path).toBe("/digests?tab=schedule");
    expect(disRow?.notes.toLowerCase()).not.toContain("sex");
    expect(disRow?.notes.toLowerCase()).not.toContain("/settings/exec-digest");
  });
});
