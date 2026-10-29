/** Offline, non-gating evidence for investigating Next 16 First Load JS regressions. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TRACKED_ROUTES,
  normalizeRouteBundleStatsRoute,
} from "./first-load-js-baseline.mjs";

const round = (value) => Math.round(value * 10) / 10;

/**
 * @param {unknown} stats Next.js .next/diagnostics/route-bundle-stats.json
 * @param {unknown} baseline Committed First Load JS budget
 * @returns {object} Source data only; never claims a performance gate passed on missing input.
 */
export function summarizeFirstLoadEvidence(stats, baseline) {
  if (!Array.isArray(stats) || baseline === null || typeof baseline !== "object" ||
      !baseline.routes || typeof baseline.routes !== "object" ||
      typeof baseline.regressionToleranceKb !== "number" || !Number.isFinite(baseline.regressionToleranceKb) ||
      baseline.regressionToleranceKb < 0) {
    throw new Error("Invalid First Load JS stats or baseline");
  }

  const byRoute = new Map();
  for (const entry of stats) {
    if (!entry || typeof entry.route !== "string" ||
        typeof entry.firstLoadUncompressedJsBytes !== "number" ||
        !Number.isFinite(entry.firstLoadUncompressedJsBytes) ||
        entry.firstLoadUncompressedJsBytes < 0) continue;
    const route = normalizeRouteBundleStatsRoute(entry.route);
    if (!TRACKED_ROUTES.includes(route)) continue;
    const chunks = Array.isArray(entry.firstLoadChunkPaths)
      ? [...new Set(entry.firstLoadChunkPaths.filter(x => typeof x === "string" && x.length > 0))]
      : [];
    byRoute.set(route, { actualKb: round(entry.firstLoadUncompressedJsBytes / 1024), chunks });
  }

  const chunksByRoute = new Map();
  const routes = TRACKED_ROUTES.map(route => {
    const actual = byRoute.get(route);
    const budget = baseline.routes[route]?.firstLoadJsKb;
    if (!actual || typeof budget !== "number" || !Number.isFinite(budget)) {
      return { route, status: "MISSING_EVIDENCE" };
    }
    for (const chunk of actual.chunks) {
      if (!chunksByRoute.has(chunk)) chunksByRoute.set(chunk, new Set());
      chunksByRoute.get(chunk).add(route);
    }
    return {
      route,
      status: actual.actualKb > budget + baseline.regressionToleranceKb ? "OVER_BUDGET" : "WITHIN_BUDGET",
      actualKb: actual.actualKb,
      baselineKb: budget,
      deltaKb: round(actual.actualKb - budget),
      toleranceKb: baseline.regressionToleranceKb,
      chunkPathsAvailable: actual.chunks.length > 0,
    };
  });

  // Chunk paths are *not* byte sizes. Frequency helps identify common bundles;
  // this reporter deliberately does not invent contribution sizes.
  const commonChunks = [...chunksByRoute.entries()]
    .filter(([, routes]) => routes.size > 1)
    .map(([path, routes]) => ({ path, routeCount: routes.size, routes: [...routes].sort() }))
    .sort((a, b) => b.routeCount - a.routeCount || a.path.localeCompare(b.path))
    .slice(0, 40);

  return {
    schemaVersion: 1,
    evidenceType: "NEXT_BUILD_ROUTE_STATS_ONLY_NOT_FIELD_PERFORMANCE",
    routes,
    commonChunks,
    missingRouteCount: routes.filter(x => x.status === "MISSING_EVIDENCE").length,
    overBudgetRouteCount: routes.filter(x => x.status === "OVER_BUDGET").length,
  };
}

function main() {
  const [statsPath = ".next/diagnostics/route-bundle-stats.json",
    baselinePath = "performance/first-load-js-baseline.v1.json",
    reportPath = ".next/diagnostics/first-load-evidence.json"] = process.argv.slice(2);
  if (!existsSync(statsPath)) {
    console.log("No route bundle stats at " + statsPath + "; no First Load JS evidence available.");
    return;
  }
  const stats = JSON.parse(readFileSync(statsPath, "utf8"));
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const report = summarizeFirstLoadEvidence(stats, baseline);
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n");
  console.log("Route evidence: " + report.overBudgetRouteCount + " over budget, " +
    report.missingRouteCount + " missing; " + report.commonChunks.length + " shared chunk paths. " + reportPath);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) {
    console.error("First Load JS evidence error: " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
