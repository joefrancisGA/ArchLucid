import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Canonical owner workbook template consumed by ui-route-traffic drift tests. */
export const UI_ROUTE_TRAFFIC_ESTIMATES_TEMPLATE_PATH =
  "docs/architecture/ui_route_traffic_estimates.template.md" as const;

export type TrafficWorkbookRow = {
  readonly id: string;
  readonly path: string;
  readonly section: string;
  readonly done: string;
  readonly notes: string;
};

export function readUiRouteTrafficEstimatesTemplateMarkdown(): string {
  return readFileSync(
    join(process.cwd(), "..", UI_ROUTE_TRAFFIC_ESTIMATES_TEMPLATE_PATH),
    "utf8",
  );
}

export function extractMasterTableRows(markdown: string): TrafficWorkbookRow[] {
  const marker = "## Master table";
  const start = markdown.indexOf(marker);

  if (start < 0) {
    throw new Error(`Missing master table in ${UI_ROUTE_TRAFFIC_ESTIMATES_TEMPLATE_PATH}`);
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

export function loadUiRouteTrafficMasterTableRows(): TrafficWorkbookRow[] {
  return extractMasterTableRows(readUiRouteTrafficEstimatesTemplateMarkdown());
}

export type UiRouteTrafficWorkbookModuleRow = {
  readonly modulePath: string;
  readonly rowId: string;
  readonly path: string;
  readonly section: string;
  readonly note: string;
};

/** Pulls the standard four workbook exports from a ui-route-traffic module namespace. */
export function extractUiRouteTrafficWorkbookRowFromModule(
  modulePath: string,
  moduleExports: Record<string, unknown>,
): UiRouteTrafficWorkbookModuleRow | null {
  const rowIdKey = Object.keys(moduleExports).find(
    (key) => key.endsWith("_TRAFFIC_ROW_ID") && typeof moduleExports[key] === "string",
  );

  if (rowIdKey === undefined) {
    return null;
  }

  const prefix = rowIdKey.slice(0, -"_TRAFFIC_ROW_ID".length);
  const rowId = moduleExports[rowIdKey];

  if (typeof rowId !== "string") {
    return null;
  }

  const path = moduleExports[`${prefix}_TRAFFIC_PATH`];
  const section = moduleExports[`${prefix}_TRAFFIC_SECTION`];
  const note = moduleExports[`${prefix}_TRAFFIC_NOTE`];

  if (typeof path !== "string" || typeof section !== "string" || typeof note !== "string") {
    return null;
  }

  return {
    modulePath,
    rowId,
    path,
    section,
    note,
  };
}

export function findUiRouteTrafficTemplateRow(
  templateRows: readonly TrafficWorkbookRow[],
  rowId: string,
): TrafficWorkbookRow | undefined {
  return templateRows.find((candidate) => candidate.id === rowId);
}

/** Back-compat alias for drift tests mid-migration to shared workbook helpers. */
export function findTrafficRowById(
  templateRows: readonly TrafficWorkbookRow[],
  rowId: string,
): TrafficWorkbookRow | undefined {
  return findUiRouteTrafficTemplateRow(templateRows, rowId);
}

export function extractMasterTablePaths(markdown: string): string[] {
  const marker = "## Master table";
  const start = markdown.indexOf(marker);

  if (start < 0) {
    throw new Error(`Missing master table in ${UI_ROUTE_TRAFFIC_ESTIMATES_TEMPLATE_PATH}`);
  }

  const paths: string[] = [];

  for (const line of markdown.slice(start).split("\n")) {
    const match = line.match(/^\| [^|]+ \| `([^`]+)` \|/);

    if (match !== null) {
      paths.push(match[1]);
    }
  }

  return paths;
}
