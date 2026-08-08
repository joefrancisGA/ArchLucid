import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  POLICY_PACK_DETAIL_TRAFFIC_NOTE,
  POLICY_PACK_DETAIL_TRAFFIC_PATH,
  POLICY_PACK_DETAIL_TRAFFIC_ROW_ID,
  POLICY_PACK_DETAIL_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-policy-pack-detail";

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

describe("ui-route-traffic-policy-pack-detail (GPI)", () => {
  it("tracks Policy pack detail with honest workbook notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === POLICY_PACK_DETAIL_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(POLICY_PACK_DETAIL_TRAFFIC_PATH);
    expect(row?.section).toBe(POLICY_PACK_DETAIL_TRAFFIC_SECTION);
    expect(row?.notes).toBe(POLICY_PACK_DETAIL_TRAFFIC_NOTE);
    expect(row?.notes).toContain("PolicyPackDetailClient");
    expect(row?.notes).toContain("PolicyPackDetailSourcesStrip");
    expect(row?.notes).toContain("Score 48");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
