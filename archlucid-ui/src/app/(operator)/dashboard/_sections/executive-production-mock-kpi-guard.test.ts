import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uiRoot = join(__dirname, "..", "..", "..", "..", "..");

const MOCK_KPI_IMPORT_PATTERN =
  /from\s+['"].*executive-roi-dashboard-mock-kpis['"]|executiveRoiDashboardMockKpis/;

const LEGACY_MOCK_EXECUTIVE_DASHBOARD_PATTERN =
  /from\s+['"]@\/components\/dashboard\/ExecutiveRoiDashboard['"]|<ExecutiveRoiDashboard[\s/>]/;

const MOCK_REPORTS_EXECUTIVE_SUMMARY_PATTERN =
  /getExecutiveSummary\s*\(|from\s+['"]@\/lib\/api\/reports-api['"]/;

const FORBIDDEN_LOCAL_SAVINGS_MATH =
  /\bannualizedUsd\s*[\*\/+-]|\bestimatedUsdSavings\s*[\*\/+-]|\borphanCandidates\.candidateCount\s*\*/;

const PRODUCTION_ROUTE_ROOTS = [
  join(uiRoot, "src", "app", "(operator)", "dashboard"),
  join(uiRoot, "src", "app", "(operator)", "value-report"),
  join(uiRoot, "src", "app", "(executive)"),
];

const GUARD_SELF_FILES = [
  "executive-roi-dashboard-mock-kpis.ts",
  "executive-production-mock-kpi-guard.test.ts",
];

function listSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      listSourceFiles(full, acc);
      continue;
    }

    if (!full.endsWith(".ts") && !full.endsWith(".tsx")) {
      continue;
    }

    if (GUARD_SELF_FILES.some((name) => full.endsWith(name))) {
      continue;
    }

    acc.push(full);
  }

  return acc;
}

function collectOffenders(pattern: RegExp): string[] {
  const offenders: string[] = [];

  for (const root of PRODUCTION_ROUTE_ROOTS) {
    for (const file of listSourceFiles(root)) {
      const src = readFileSync(file, "utf8");

      if (pattern.test(src)) {
        offenders.push(file);
      }
    }
  }

  return offenders;
}

describe("production executive routes mock KPI guard (TB-062 / Batch C item 17)", () => {
  it("detects banned mock KPI import patterns in fixture strings", () => {
    expect(MOCK_KPI_IMPORT_PATTERN.test("import { executiveRoiDashboardMockKpis } from '../executive-roi-dashboard-mock-kpis'")).toBe(
      true,
    );
    expect(LEGACY_MOCK_EXECUTIVE_DASHBOARD_PATTERN.test("import { ExecutiveRoiDashboard } from '@/components/dashboard/ExecutiveRoiDashboard'")).toBe(
      true,
    );
    expect(MOCK_REPORTS_EXECUTIVE_SUMMARY_PATTERN.test("import { getExecutiveSummary } from '@/lib/api/reports-api'")).toBe(true);
  });

  it("does not import demo-only executive mock KPI module from production dashboard, value-report, or executive routes", () => {
    expect(
      collectOffenders(MOCK_KPI_IMPORT_PATTERN),
      "Remove mock KPI imports; use ExecutiveRoiDashboardLiveKpiCards.",
    ).toEqual([]);
  });

  it("does not import legacy mocked ExecutiveRoiDashboard component in production executive routes", () => {
    expect(
      collectOffenders(LEGACY_MOCK_EXECUTIVE_DASHBOARD_PATTERN),
      "Use ExecutiveRoiDashboardLiveKpiCards instead of ExecutiveRoiDashboard.",
    ).toEqual([]);
  });

  it("does not call mocked /v1/reports/executive-summary client from production executive routes", () => {
    expect(
      collectOffenders(MOCK_REPORTS_EXECUTIVE_SUMMARY_PATTERN),
      "Use GET /v1/roi/executive-summary via ExecutiveRoiSummary types instead.",
    ).toEqual([]);
  });

  it("does not recompute executive savings math locally in production executive routes", () => {
    expect(
      collectOffenders(FORBIDDEN_LOCAL_SAVINGS_MATH),
      "Use GET /v1/roi/executive-summary fields instead of client-side savings math.",
    ).toEqual([]);
  });
});
