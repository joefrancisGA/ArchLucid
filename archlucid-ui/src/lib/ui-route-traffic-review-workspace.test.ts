import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  REVIEW_WORKSPACE_TRAFFIC_NOTE,
  REVIEW_WORKSPACE_TRAFFIC_PATH,
  REVIEW_WORKSPACE_TRAFFIC_ROW_ID,
  REVIEW_WORKSPACE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-review-workspace";

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

describe("ui-route-traffic-review-workspace (RRE)", () => {
  it("tracks review workspace with former SRN hit share and no SRN row", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const rre = rows.find((candidate) => candidate.id === REVIEW_WORKSPACE_TRAFFIC_ROW_ID);
    const srn = rows.find((candidate) => candidate.id === "SRN");

    expect(srn).toBeUndefined();
    expect(rre).toBeDefined();
    expect(rre?.path).toBe(REVIEW_WORKSPACE_TRAFFIC_PATH);
    expect(rre?.hitPct).toBe("10.04%");
    expect(rre?.section).toBe(REVIEW_WORKSPACE_TRAFFIC_SECTION);
    expect(rre?.notes).toBe(REVIEW_WORKSPACE_TRAFFIC_NOTE);
    expect(rre?.notes).toContain("Absorbs former SRN");
    expect(rre?.notes).toContain("findings-first reviewTab queue");
    expect(rre?.notes).toContain("Score 76");
    expect(rre?.notes).toContain("HCD = contextual help drawer");
  });
});
