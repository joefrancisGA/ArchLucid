import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  EVIDENCE_TRACE_TRAFFIC_NOTE,
  EVIDENCE_TRACE_TRAFFIC_PATH,
  EVIDENCE_TRACE_TRAFFIC_ROW_ID,
  EVIDENCE_TRACE_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-evidence-trace";

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

describe("ui-route-traffic-evidence-trace (ERU)", () => {
  it("tracks evidence-trace with former RR hit share and no RR row", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const eru = rows.find((candidate) => candidate.id === EVIDENCE_TRACE_TRAFFIC_ROW_ID);
    const rr = rows.find((candidate) => candidate.id === "RR");

    expect(rr).toBeUndefined();
    expect(eru).toBeDefined();
    expect(eru?.path).toBe(EVIDENCE_TRACE_TRAFFIC_PATH);
    expect(eru?.hitPct).toBe("0.4%");
    expect(eru?.section).toBe(EVIDENCE_TRACE_TRAFFIC_SECTION);
    expect(eru?.notes).toBe(EVIDENCE_TRACE_TRAFFIC_NOTE);
    expect(eru?.notes).toContain("Absorbs former RR");
  });
});
