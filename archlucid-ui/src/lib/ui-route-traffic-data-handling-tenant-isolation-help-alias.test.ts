import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DATA_HANDLING_TENANT_ISOLATION_HELP_PATH } from "@/lib/data-handling-tenant-isolation-help-route";
import { resolveHelpTopicPermanentRedirect } from "@/lib/help-topic-permanent-redirects";
import {
  CANONICAL_DATA_HANDLING_HELP_TRAFFIC_PATH,
  REMOVED_DATA_HANDLING_TENANT_ISOLATION_HELP_ALIAS_TRAFFIC_ROW_ID,
  RETIRED_DATA_HANDLING_TENANT_ISOLATION_HELP_ALIAS_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-data-handling-tenant-isolation-help-alias";

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

describe("ui-route-traffic data-handling-tenant-isolation alias retirement (HDA merged into HED)", () => {
  it("permanently redirects the retired alias slug to canonical data-handling", () => {
    expect(resolveHelpTopicPermanentRedirect("data-handling-tenant-isolation")).toBe(
      DATA_HANDLING_TENANT_ISOLATION_HELP_PATH,
    );
  });

  it("does not track retired HDA; data-handling help stays on HED only", () => {
    const rows = extractMasterTableRows(readTemplateMarkdown());
    const hdaRow = rows.find((row) => row.id === REMOVED_DATA_HANDLING_TENANT_ISOLATION_HELP_ALIAS_TRAFFIC_ROW_ID);
    const retiredPathRows = rows.filter(
      (row) => row.path === RETIRED_DATA_HANDLING_TENANT_ISOLATION_HELP_ALIAS_TRAFFIC_PATH,
    );
    const canonicalRows = rows.filter((row) => row.path === CANONICAL_DATA_HANDLING_HELP_TRAFFIC_PATH);

    expect(hdaRow).toBeUndefined();
    expect(retiredPathRows).toHaveLength(0);
    expect(canonicalRows).toHaveLength(1);
    expect(canonicalRows[0]?.id).toBe("HED");
  });
});
