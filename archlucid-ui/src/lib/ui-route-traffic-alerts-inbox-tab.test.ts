import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ALERTS_INBOX_TAB_TRAFFIC_NOTE,
  ALERTS_INBOX_TAB_TRAFFIC_PATH,
  ALERTS_INBOX_TAB_TRAFFIC_ROW_ID,
  ALERTS_INBOX_TAB_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-alerts-inbox-tab";

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

describe("ui-route-traffic-alerts-inbox-tab (GOI)", () => {
  it("tracks legacy inbox tab under Tab surface with redirect Evidence notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === ALERTS_INBOX_TAB_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(ALERTS_INBOX_TAB_TRAFFIC_PATH);
    expect(row?.section).toBe(ALERTS_INBOX_TAB_TRAFFIC_SECTION);
    expect(row?.notes).toBe(ALERTS_INBOX_TAB_TRAFFIC_NOTE);
    expect(row?.notes).toContain("shouldCanonicalizeAlertsInboxTabParam");
    expect(row?.notes).toContain("Score 28");
  });
});
