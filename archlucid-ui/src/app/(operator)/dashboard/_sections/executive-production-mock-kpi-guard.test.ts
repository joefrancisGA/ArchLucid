import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiRoot = join(__dirname, "..", "..", "..", "..", "..");

const MOCK_IMPORT_PATTERN =
  /from\s+['"].*executive-roi-dashboard-mock-kpis['"]|executiveRoiDashboardMockKpis/;

const PRODUCTION_ROUTE_ROOTS = [
  join(uiRoot, "src", "app", "(operator)", "dashboard"),
  join(uiRoot, "src", "app", "(executive)"),
];

function listSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      listSourceFiles(full, acc);
      continue;
    }

    if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      if (
        !full.includes("executive-roi-dashboard-mock-kpis") &&
        !full.includes("executive-production-mock-kpi-guard")
      ) {
        acc.push(full);
      }
    }
  }

  return acc;
}

describe("production executive routes mock KPI guard (TB-062 / Batch C)", () => {
  it("does not import demo-only executive mock KPI module from production dashboard or executive routes", () => {
    const offenders: string[] = [];

    for (const root of PRODUCTION_ROUTE_ROOTS) {
      for (const file of listSourceFiles(root)) {
        const src = readFileSync(file, "utf8");

        if (MOCK_IMPORT_PATTERN.test(src)) {
          offenders.push(file);
        }
      }
    }

    expect(offenders, "Remove mock KPI imports; use ExecutiveRoiDashboardLiveKpiCards.").toEqual([]);
  });
});
