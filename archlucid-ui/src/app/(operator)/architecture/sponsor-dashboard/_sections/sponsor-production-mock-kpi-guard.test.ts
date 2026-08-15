import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
// _sections → sponsor-dashboard → architecture → (operator) → app → src → archlucid-ui
const uiRoot = join(__dirname, "..", "..", "..", "..", "..", "..");

const MOCK_KPI_IMPORT_PATTERN =
  /from\s+['"].*sponsor-roi-dashboard-mock-kpis['"]|sponsorRoiDashboardMockKpis/;

const LEGACY_MOCK_SPONSOR_DASHBOARD_PATTERN =
  /from\s+['"]@\/components\/dashboard\/SponsorRoiDashboard['"]|<SponsorRoiDashboard[\s/>]/;

const MOCK_REPORTS_SPONSOR_SUMMARY_PATTERN =
  /getSponsorSummary\s*\(|from\s+['"]@\/lib\/api\/reports-api['"]/;

const FORBIDDEN_LOCAL_SAVINGS_MATH =
  /\bannualizedUsd\s*[\*\/+-]|\bestimatedUsdSavings\s*[\*\/+-]|\borphanCandidates\.candidateCount\s*\*/;

const PRODUCTION_ROUTE_ROOTS = [
  join(uiRoot, "src", "app", "(operator)", "architecture", "sponsor-dashboard"),
  join(uiRoot, "src", "app", "(operator)", "value-report"),
];

const GUARD_SELF_FILES = [
  "sponsor-roi-dashboard-mock-kpis.ts",
  "sponsor-production-mock-kpi-guard.test.ts",
];

function listSourceFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) {
    return acc;
  }

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

describe("production sponsor routes mock KPI guard (TB-062 / Batch C item 17)", () => {
  it("detects banned mock KPI import patterns in fixture strings", () => {
    expect(MOCK_KPI_IMPORT_PATTERN.test("import { sponsorRoiDashboardMockKpis } from '../sponsor-roi-dashboard-mock-kpis'")).toBe(
      true,
    );
    expect(LEGACY_MOCK_SPONSOR_DASHBOARD_PATTERN.test("import { SponsorRoiDashboard } from '@/components/dashboard/SponsorRoiDashboard'")).toBe(
      true,
    );
    expect(MOCK_REPORTS_SPONSOR_SUMMARY_PATTERN.test("import { getSponsorSummary } from '@/lib/api/reports-api'")).toBe(true);
  });

  it("does not import demo-only sponsor mock KPI module from production dashboard, value-report, or sponsor routes", () => {
    expect(
      collectOffenders(MOCK_KPI_IMPORT_PATTERN),
      "Remove mock KPI imports; use SponsorRoiDashboardLiveKpiCards.",
    ).toEqual([]);
  });

  it("does not import legacy mocked SponsorRoiDashboard component in production sponsor routes", () => {
    expect(
      collectOffenders(LEGACY_MOCK_SPONSOR_DASHBOARD_PATTERN),
      "Use SponsorRoiDashboardLiveKpiCards instead of SponsorRoiDashboard.",
    ).toEqual([]);
  });

  it("does not call mocked /v1/reports/sponsor-report client from production sponsor routes", () => {
    expect(
      collectOffenders(MOCK_REPORTS_SPONSOR_SUMMARY_PATTERN),
      "Use GET /v1/roi/sponsor-report via SponsorRoiSummary types instead.",
    ).toEqual([]);
  });

  it("does not recompute sponsor savings math locally in production sponsor routes", () => {
    expect(
      collectOffenders(FORBIDDEN_LOCAL_SAVINGS_MATH),
      "Use GET /v1/roi/sponsor-report fields instead of client-side savings math.",
    ).toEqual([]);
  });
});
