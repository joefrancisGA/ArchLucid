import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CANONICAL_SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
  REMOVED_RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID,
  RETIRED_RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-run-artifact-preview";

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
      id: cells[1] ?? "",
      path: (cells[2] ?? "").replace(/^`|`$/g, ""),
      notes: cells[8] ?? "",
    });
  }

  return rows;
}

describe("ui-route-traffic-run-artifact-preview (RER removed)", () => {
  it("does not track RER; artifact Preview stays on GAR", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const rerRow = rows.find((row) => row.id === REMOVED_RUN_ARTIFACT_PREVIEW_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === RETIRED_RUN_ARTIFACT_PREVIEW_TRAFFIC_PATH);
    const garRow = rows.find(
      (row) => row.path === CANONICAL_SIGNED_RECORD_ARTIFACT_PREVIEW_TRAFFIC_PATH,
    );

    expect(rerRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(garRow).toBeDefined();
  });
});
