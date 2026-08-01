import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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

describe("ui-route-traffic removed ITSM hub (pre-release cleanup)", () => {
  it("drops the IIX legacy ITSM hub row from the traffic workbook", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());

    expect(rows.find((row) => row.id === "IIX")).toBeUndefined();
    expect(rows.some((row) => row.path === "/integrations/itsm")).toBe(false);
  });

  it("tracks Connection status on INR with honest workbook notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = rows.find((entry) => entry.id === "INR");

    expect(row?.path).toBe("/administration/connection-status");
    expect(row?.notes).toContain("ConnectorOperationsDashboard");
  });
});
