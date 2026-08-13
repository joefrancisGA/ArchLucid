import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  DEFAULT_BASELINE_RELATIVE_PATH,
  TRACKED_ROUTES,
  buildTrackedRouteFirstLoadJsMap,
  compareFirstLoadJsBudget,
  isNext16BuildLogWithoutFirstLoadJsTable,
  parseNextBuildFirstLoadJsKb,
  parseRouteBundleStatsFirstLoadJsKb,
  readBaseline,
  readRouteBundleStats,
  resolveTrackedRouteFirstLoadJsKb,
} from "./first-load-js-baseline.mjs";

const FIXTURE_LOG = `
Route (app)                                             Size  First Load JS  Revalidate  Expire
├ ƒ /governance/approval-queue                        34.9 kB         286 kB
├ ƒ /reviews                                         33.3 kB         287 kB
├ ƒ /reviews/[runId]                                  125 kB         421 kB
├ ○ /welcome                                         8.41 kB         145 kB          5m      1y
+ First Load JS shared by all                         105 kB
`;

const NEXT16_STATS_FIXTURE = join(
  process.cwd(),
  "scripts",
  "fixtures",
  "route-bundle-stats.next16.v1.json",
);

describe("first-load-js-baseline (TB-573 / TB-691)", () => {
  it("detects Next.js 16+ build logs that omit First Load JS columns", () => {
    const next16Log = `
Route (app)                                          Revalidate  Expire
├ ○ /welcome                                                 5m      1y
├ ƒ /reviews
`;

    expect(isNext16BuildLogWithoutFirstLoadJsTable(next16Log)).toBe(true);
    expect(isNext16BuildLogWithoutFirstLoadJsTable(FIXTURE_LOG)).toBe(false);
  });

  it("parses First Load JS per route from legacy Next.js build output", () => {
    const routes = parseNextBuildFirstLoadJsKb(FIXTURE_LOG);

    expect(routes.get("/welcome")).toBe(145);
    expect(routes.get("/reviews")).toBe(287);
    expect(routes.get("/reviews/[runId]")).toBe(421);
    expect(routes.get("/governance/approval-queue")).toBe(286);
  });

  it("parses Next 16 route-bundle-stats.json into tracked routes", () => {
    const stats = readRouteBundleStats(NEXT16_STATS_FIXTURE);
    const routes = buildTrackedRouteFirstLoadJsMap(stats);

    expect(routes.get("/")).toBe(1601.3);
    expect(routes.get("/welcome")).toBe(609.1);
    expect(routes.get("/architecture/reviews")).toBe(1229.1);
    expect(routes.get("/architecture/reviews/[runId]")).toBe(1883.4);
    expect(routes.get("/governance/approval-queue")).toBe(1450.3);
    expect(routes.get("/governance/alerts")).toBe(1394.5);
    expect(routes.get("/governance/alert-rules")).toBe(1060.8);
    expect(routes.get("/architecture/sponsor-dashboard")).toBe(1489.3);
    expect(routes.get("/governance/signed-records")).toBe(1427.7);
    expect(parseRouteBundleStatsFirstLoadJsKb(stats).size).toBeGreaterThanOrEqual(9);
  });

  it("resolves legacy /reviews tracked keys from canonical architecture routes", () => {
    const stats = readRouteBundleStats(NEXT16_STATS_FIXTURE);
    const statsRoutes = parseRouteBundleStatsFirstLoadJsKb(stats);

    expect(resolveTrackedRouteFirstLoadJsKb(statsRoutes, "/architecture/reviews")).toBe(1229.1);
    expect(resolveTrackedRouteFirstLoadJsKb(statsRoutes, "/architecture/reviews/[runId]")).toBe(1883.4);
    expect(resolveTrackedRouteFirstLoadJsKb(statsRoutes, "/reviews")).toBe(1229.1);
    expect(resolveTrackedRouteFirstLoadJsKb(statsRoutes, "/reviews/[runId]")).toBe(1883.4);
  });

  it("passes when actual sizes are within baseline tolerance", () => {
    const stats = readRouteBundleStats(NEXT16_STATS_FIXTURE);
    const actualRoutes = buildTrackedRouteFirstLoadJsMap(stats);
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));
    const result = compareFirstLoadJsBudget(actualRoutes, baseline);

    expect(result.ok).toBe(true);
    expect(result.messages.some((message) => message.startsWith("FAIL:"))).toBe(false);
  });

  it("fails when /architecture/reviews exceeds baseline tolerance", () => {
    const stats = readRouteBundleStats(NEXT16_STATS_FIXTURE);
    const actualRoutes = buildTrackedRouteFirstLoadJsMap(stats);
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));
    const reviewsBaselineKb = baseline.routes["/architecture/reviews"]?.firstLoadJsKb;

    expect(reviewsBaselineKb).toBeTypeOf("number");

    // Must clear baseline + tolerance; hard-coded kB drifts when the baseline is refreshed.
    actualRoutes.set(
      "/architecture/reviews",
      (reviewsBaselineKb as number) + baseline.regressionToleranceKb + 1,
    );

    const result = compareFirstLoadJsBudget(actualRoutes, baseline);

    expect(result.ok).toBe(false);
    expect(result.messages.some((message) => message.includes("/architecture/reviews"))).toBe(true);
  });

  it("keeps committed baseline aligned with tracked routes", () => {
    const baseline = readBaseline(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH));

    for (const route of TRACKED_ROUTES) {
      expect(baseline.routes[route]?.firstLoadJsKb).toBeTypeOf("number");
    }

    const raw = readFileSync(join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH), "utf8");
    expect(raw).toContain('"schemaVersion": 1');
  });
});
