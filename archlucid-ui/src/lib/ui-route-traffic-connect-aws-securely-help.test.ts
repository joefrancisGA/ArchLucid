import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  CONNECT_AWS_SECURELY_HELP_TRAFFIC_NOTE,
  CONNECT_AWS_SECURELY_HELP_TRAFFIC_PATH,
  CONNECT_AWS_SECURELY_HELP_TRAFFIC_ROW_ID,
  CONNECT_AWS_SECURELY_HELP_TRAFFIC_SECTION,
} from "@/lib/ui-route-traffic-connect-aws-securely-help";

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

describe("ui-route-traffic-connect-aws-securely-help (HEC)", () => {
  it("tracks aws cloud-connections help with honest workbook notes", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const row = rows.find((candidate) => candidate.id === CONNECT_AWS_SECURELY_HELP_TRAFFIC_ROW_ID);

    expect(row).toBeDefined();
    expect(row?.path).toBe(CONNECT_AWS_SECURELY_HELP_TRAFFIC_PATH);
    expect(row?.section).toBe(CONNECT_AWS_SECURELY_HELP_TRAFFIC_SECTION);
    expect(row?.notes).toBe(CONNECT_AWS_SECURELY_HELP_TRAFFIC_NOTE);
    expect(row?.notes).toContain("HelpConnectAwsSecurelyGuideView");
    expect(row?.notes).toContain("Sources");
    expect(row?.notes).toContain("Score 58");
    expect(row?.notes).toContain("cannot improve further toward 80");
  });
});
