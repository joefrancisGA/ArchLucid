import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_DASHBOARD_TRAFFIC_PATH,
  GOVERNANCE_DASHBOARD_TRAFFIC_ROW_ID,
} from "@/lib/ui-route-traffic-governance-dashboard";
import { ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_ROW_ID } from "@/lib/ui-route-traffic-architecture-executive-dashboard";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

type TrafficWorkbookRow = {
  id: string;
  path: string;
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
    });
  }

  return rows;
}

describe("ui-route-traffic-governance-dashboard (GDX removed)", () => {
  it("does not track retired GDX shim; workspace health stays on ARE", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const gdxRow = rows.find((row) => row.id === GOVERNANCE_DASHBOARD_TRAFFIC_ROW_ID);
    const areRow = rows.find((row) => row.id === ARCHITECTURE_EXECUTIVE_DASHBOARD_TRAFFIC_ROW_ID);
    const retiredPathRow = rows.find((row) => row.path === GOVERNANCE_DASHBOARD_TRAFFIC_PATH);

    expect(gdxRow).toBeUndefined();
    expect(retiredPathRow).toBeUndefined();
    expect(areRow).toBeDefined();
  });
});
