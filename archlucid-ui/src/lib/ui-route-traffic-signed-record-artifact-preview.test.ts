import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE,
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID,
  SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-signed-record-artifact-preview";

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

describe("ui-route-traffic-signed-record-artifact-preview (TB-1946 / TB-1949)", () => {
  it("tracks MAM under Core review as live signed-record artifact preview SoT for RER redirect", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = findTrafficRowById(rows, SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH);
    expect(row?.section).toBe(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_SECTION);
    expect(row?.notes).toBe(SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_NOTE);
    expect(row?.section.toLowerCase()).not.toBe("marketing");
    expect(row?.notes.toLowerCase()).not.toContain("ghost");
    expect(row?.notes).toContain("TB-1821");
    expect(row?.notes).toContain("RER");
    expect(row?.notes.toLowerCase()).toContain("app router");
  });
});
