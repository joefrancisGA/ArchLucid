import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { UI_ROOT as uiRoot } from "@/lib/testing/repo-paths";

const MOCK_KPI_IMPORT_PATTERN =
  /from\s+['"]@\/lib\/executive-roi-dashboard-mock-kpis['"]|from\s+['"].*executive-roi-dashboard-mock-kpis['"]|executiveRoiDashboardMockKpis/;

const ILLUSTRATIVE_SPINE_USD_PATTERN = /SHOWCASE_STATIC_DEMO_ILLUSTRATIVE_ANNUALIZED_EXTRACTION_USD/;

const GOLDEN_PATH_ROOTS = [
  join(uiRoot, "src", "app", "(operator)", "architecture", "reviews"),
  join(uiRoot, "src", "app", "(operator)", "manifests"),
  join(uiRoot, "src", "app", "(operator)", "governance"),
  join(uiRoot, "src", "app", "(operator)", "dashboard"),
  join(uiRoot, "src", "app", "(operator)", "ask"),
];

const ALLOWLIST_SUFFIXES = [
  "executive-roi-dashboard-mock-kpis.ts",
  "executive-production-mock-kpi-guard.test.ts",
  "buyer-polished-golden-path-import-guard.test.ts",
  "showcase-static-demo.ts",
  "run-savings-summary-model.ts",
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

    if (ALLOWLIST_SUFFIXES.some((name) => full.endsWith(name))) {
      continue;
    }

    acc.push(full);
  }

  return acc;
}

function collectOffenders(pattern: RegExp): string[] {
  const offenders: string[] = [];

  for (const root of GOLDEN_PATH_ROOTS) {
    if (!existsSync(root)) {
      continue;
    }

    for (const file of listSourceFiles(root)) {
      const src = readFileSync(file, "utf8");

      if (pattern.test(src)) {
        offenders.push(file);
      }
    }
  }

  return offenders;
}

describe("buyer golden-path production import guard (TB-273 / BDA-150)", () => {
  it("does not import demo-only executive mock KPI module from golden-path routes", () => {
    expect(
      collectOffenders(MOCK_KPI_IMPORT_PATTERN),
      "Remove mock KPI imports from buyer golden-path routes.",
    ).toEqual([]);
  });

  it("does not reference illustrative spine USD constant from golden-path routes", () => {
    expect(
      collectOffenders(ILLUSTRATIVE_SPINE_USD_PATTERN),
      "Bind savings to API fields — do not import illustrative spine USD in golden-path routes.",
    ).toEqual([]);
  });
});
