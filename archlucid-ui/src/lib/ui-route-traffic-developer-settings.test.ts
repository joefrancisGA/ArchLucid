import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEVELOPER_SETTINGS_CUSTOMER_SHELL_REDIRECT_PATH,
  DEVELOPER_SETTINGS_TRAFFIC_LEGACY_ROW_ID,
  DEVELOPER_SETTINGS_TRAFFIC_MONTHLY_SHARE,
  DEVELOPER_SETTINGS_TRAFFIC_NOTE,
  DEVELOPER_SETTINGS_TRAFFIC_PATH,
  DEVELOPER_SETTINGS_TRAFFIC_ROW_ID,
  DEVELOPER_SETTINGS_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-developer-settings";

const TEMPLATE_PATH = "docs/architecture/ui_route_traffic_estimates.template.md";

type TrafficWorkbookRow = {
  id: string;
  path: string;
  monthlyShare: string;
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
      monthlyShare: cells[3],
      section: cells[7],
      notes: cells[8],
    });
  }

  return rows;
}

function findTrafficRowById(rows: TrafficWorkbookRow[], rowId: string): TrafficWorkbookRow | undefined {
  return rows.find((row) => row.id === rowId);
}

describe("ui-route-traffic-developer-settings (SDX / SED)", () => {
  it("tracks Internal developer tools as internal-gated with zero buyer traffic weight", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = findTrafficRowById(rows, DEVELOPER_SETTINGS_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(DEVELOPER_SETTINGS_TRAFFIC_PATH);
    expect(row?.monthlyShare).toBe(DEVELOPER_SETTINGS_TRAFFIC_MONTHLY_SHARE);
    expect(row?.section).toBe(DEVELOPER_SETTINGS_TRAFFIC_SECTION);
    expect(row?.notes).toBe(DEVELOPER_SETTINGS_TRAFFIC_NOTE);
    expect(row?.notes).toContain("legacy owner SED");
    expect(row?.notes).toContain(DEVELOPER_SETTINGS_CUSTOMER_SHELL_REDIRECT_PATH);
    expect(row?.notes).toContain("never scored as buyer Settings hub");
    expect(row?.notes).toContain("DeveloperSettingsPageClient");
    expect(DEVELOPER_SETTINGS_TRAFFIC_LEGACY_ROW_ID).toBe("SED");
  });
});
