/**
 * TB-573 / TB-691 — Compare per-route First Load JS against a committed baseline.
 * Next 16+ reads `.next/diagnostics/route-bundle-stats.json`; Next 15 logs remain supported.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** @typedef {{ schemaVersion: number; updatedUtc: string; regressionToleranceKb: number; routes: Record<string, { firstLoadJsKb: number }>; notes?: string }} FirstLoadJsBaseline */

/** @typedef {{ route: string; firstLoadUncompressedJsBytes: number; firstLoadChunkPaths?: string[] }} RouteBundleStat */

export const DEFAULT_BASELINE_RELATIVE_PATH = join("performance", "first-load-js-baseline.v1.json");

export const DEFAULT_ROUTE_BUNDLE_STATS_RELATIVE_PATH = join(
  ".next",
  "diagnostics",
  "route-bundle-stats.json",
);

/** Routes tracked for UI performance regression gates (TB-573). */
export const TRACKED_ROUTES = [
  "/",
  "/welcome",
  "/architecture/reviews",
  "/architecture/reviews/[reviewId]",
  "/governance/approval-queue",
  "/governance/alerts",
  "/governance/alert-rules",
  "/architecture/sponsor-dashboard",
  "/governance/sealed-records",
];

const ROUTE_LINE =
  /(\/[A-Za-z0-9[\]/_\-]+)\s+[\d.]+\s+(?:kB|B)\s+([\d.]+)\s+kB/;

/**
 * Next.js 16+ route tables list Revalidate/Expire but omit the legacy Size / First Load JS columns.
 * @param {string} buildLog
 * @returns {boolean}
 */
export function isNext16BuildLogWithoutFirstLoadJsTable(buildLog) {
  return (
    buildLog.includes("Route (app)") &&
    buildLog.includes("Revalidate") &&
    !buildLog.includes("First Load JS")
  );
}

/**
 * @param {string} buildLog
 * @returns {Map<string, number>}
 */
export function parseNextBuildFirstLoadJsKb(buildLog) {
  /** @type {Map<string, number>} */
  const routes = new Map();

  for (const line of buildLog.split(/\r?\n/)) {
    const match = ROUTE_LINE.exec(line);

    if (match === null) {
      continue;
    }

    const route = match[1];
    const firstLoadJsKb = Number.parseFloat(match[2]);

    if (!Number.isFinite(firstLoadJsKb)) {
      continue;
    }

    routes.set(route, firstLoadJsKb);
  }

  return routes;
}

/**
 * @param {string} route
 * @returns {string}
 */
export function normalizeRouteBundleStatsRoute(route) {
  if (route.endsWith("/page")) {
    const trimmed = route.slice(0, -"/page".length);

    return trimmed.length === 0 ? "/" : trimmed;
  }

  return route;
}

/**
 * @param {readonly RouteBundleStat[]} stats
 * @returns {Map<string, number>}
 */
export function parseRouteBundleStatsFirstLoadJsKb(stats) {
  /** @type {Map<string, number>} */
  const routes = new Map();

  for (const entry of stats) {
    if (typeof entry.route !== "string" || typeof entry.firstLoadUncompressedJsBytes !== "number") {
      continue;
    }

    const normalizedRoute = normalizeRouteBundleStatsRoute(entry.route);
    const firstLoadJsKb = roundKb(entry.firstLoadUncompressedJsBytes / 1024);

    routes.set(normalizedRoute, firstLoadJsKb);
  }

  return routes;
}

/** @deprecated Legacy baseline keys kept for one release so stale JSON still resolves. */
const TRACKED_ROUTE_STATS_ALIASES = {
  "/reviews": "/architecture/reviews",
  "/reviews/[reviewId]": "/architecture/reviews/[reviewId]",
};

/**
 * @param {Map<string, number>} statsRoutes
 * @param {string} trackedRoute
 * @returns {number | undefined}
 */
export function resolveTrackedRouteFirstLoadJsKb(statsRoutes, trackedRoute) {
  const direct = statsRoutes.get(trackedRoute);

  if (direct !== undefined) {
    return direct;
  }

  const pageVariant = `${trackedRoute}/page`;
  const pageMatch = statsRoutes.get(pageVariant);

  if (pageMatch !== undefined) {
    return pageMatch;
  }

  const aliasRoute = TRACKED_ROUTE_STATS_ALIASES[trackedRoute];

  if (aliasRoute !== undefined) {
    return resolveTrackedRouteFirstLoadJsKb(statsRoutes, aliasRoute);
  }

  return undefined;
}

/**
 * @param {readonly RouteBundleStat[]} stats
 * @param {readonly string[]} [trackedRoutes]
 * @returns {Map<string, number>}
 */
export function buildTrackedRouteFirstLoadJsMap(stats, trackedRoutes = TRACKED_ROUTES) {
  const statsRoutes = parseRouteBundleStatsFirstLoadJsKb(stats);
  /** @type {Map<string, number>} */
  const tracked = new Map();

  for (const route of trackedRoutes) {
    const firstLoadJsKb = resolveTrackedRouteFirstLoadJsKb(statsRoutes, route);

    if (firstLoadJsKb !== undefined) {
      tracked.set(route, firstLoadJsKb);
    }
  }

  return tracked;
}

/**
 * @param {string} statsPath
 * @returns {readonly RouteBundleStat[]}
 */
export function readRouteBundleStats(statsPath) {
  const raw = readFileSync(statsPath, "utf8");
  /** @type {unknown} */
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(`Route bundle stats must be a JSON array: ${statsPath}`);
  }

  return parsed;
}

/**
 * @param {string} baselinePath
 * @returns {FirstLoadJsBaseline}
 */
export function readBaseline(baselinePath) {
  const raw = readFileSync(baselinePath, "utf8");
  /** @type {FirstLoadJsBaseline} */
  const baseline = JSON.parse(raw);

  if (baseline.schemaVersion !== 1) {
    throw new Error(`Unsupported baseline schemaVersion: ${baseline.schemaVersion}`);
  }

  if (typeof baseline.regressionToleranceKb !== "number" || baseline.regressionToleranceKb < 0) {
    throw new Error("Baseline regressionToleranceKb must be a non-negative number.");
  }

  return baseline;
}

/**
 * @param {Map<string, number>} actualRoutes
 * @param {FirstLoadJsBaseline} baseline
 * @param {readonly string[]} [trackedRoutes]
 * @returns {{ ok: boolean; messages: string[] }}
 */
export function compareFirstLoadJsBudget(actualRoutes, baseline, trackedRoutes = TRACKED_ROUTES) {
  /** @type {string[]} */
  const messages = [];
  let ok = true;

  for (const route of trackedRoutes) {
    const baselineEntry = baseline.routes[route];

    if (baselineEntry === undefined) {
      ok = false;
      messages.push(`ERROR: baseline missing tracked route ${route}`);
      continue;
    }

    const actual = actualRoutes.get(route);

    if (actual === undefined) {
      ok = false;
      messages.push(`ERROR: build output missing tracked route ${route}`);
      continue;
    }

    const baselineKb = baselineEntry.firstLoadJsKb;
    const ceilingKb = baselineKb + baseline.regressionToleranceKb;
    const deltaKb = roundKb(actual - baselineKb);

    if (actual > ceilingKb) {
      ok = false;
      messages.push(
        `FAIL: ${route} First Load JS ${actual} kB exceeds baseline ${baselineKb} kB + tolerance ${baseline.regressionToleranceKb} kB (delta +${deltaKb} kB).`,
      );
      continue;
    }

    if (actual < baselineKb) {
      messages.push(
        `INFO: ${route} improved (${actual} kB vs baseline ${baselineKb} kB, delta ${deltaKb} kB). Consider refreshing the baseline.`,
      );
      continue;
    }

    messages.push(`OK: ${route} ${actual} kB (baseline ${baselineKb} kB, within +${baseline.regressionToleranceKb} kB tolerance).`);
  }

  return { ok, messages };
}

/**
 * @param {Map<string, number>} actualRoutes
 * @param {FirstLoadJsBaseline} existingBaseline
 * @param {readonly string[]} [trackedRoutes]
 * @returns {FirstLoadJsBaseline}
 */
export function buildUpdatedBaseline(actualRoutes, existingBaseline, trackedRoutes = TRACKED_ROUTES) {
  /** @type {Record<string, { firstLoadJsKb: number }>} */
  const routes = { ...existingBaseline.routes };

  for (const route of trackedRoutes) {
    const actual = actualRoutes.get(route);

    if (actual === undefined) {
      throw new Error(`Cannot write baseline: build output missing tracked route ${route}`);
    }

    routes[route] = { firstLoadJsKb: roundKb(actual) };
  }

  return {
    schemaVersion: 1,
    updatedUtc: new Date().toISOString(),
    regressionToleranceKb: existingBaseline.regressionToleranceKb,
    routes,
    notes: existingBaseline.notes,
  };
}

/**
 * @param {number} value
 * @returns {number}
 */
function roundKb(value) {
  return Math.round(value * 10) / 10;
}

/**
 * @param {string} buildLogPath
 * @returns {string}
 */
function readBuildLog(buildLogPath) {
  const buffer = readFileSync(buildLogPath);

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le");
  }

  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return buffer.toString("utf8").replace(/^\uFEFF/, "");
  }

  return buffer.toString("utf8");
}

/**
 * @param {string | null} statsPath
 * @param {string | null} logPath
 * @returns {Map<string, number>}
 */
function resolveActualRoutes(statsPath, logPath) {
  if (statsPath !== null) {
    if (!existsSync(statsPath)) {
      throw new Error(
        `Route bundle stats not found at ${statsPath}. Run production \`npm run build\` first (Next 16 writes ${DEFAULT_ROUTE_BUNDLE_STATS_RELATIVE_PATH}).`,
      );
    }

    const stats = readRouteBundleStats(statsPath);
    const tracked = buildTrackedRouteFirstLoadJsMap(stats);

    if (tracked.size === 0) {
      throw new Error(`Route bundle stats at ${statsPath} did not contain any tracked routes.`);
    }

    return tracked;
  }

  if (logPath === null) {
    throw new Error(
      "check requires --stats <path> (preferred on Next 16+) or --log <path> (legacy Next 15 build output).",
    );
  }

  const buildLog = readBuildLog(logPath);

  if (isNext16BuildLogWithoutFirstLoadJsTable(buildLog)) {
    throw new Error(
      "Next.js 16+ build logs omit per-route First Load JS. Re-run with --stats .next/diagnostics/route-bundle-stats.json after `npm run build`.",
    );
  }

  const actualRoutes = parseNextBuildFirstLoadJsKb(buildLog);

  if (actualRoutes.size === 0) {
    throw new Error(`Build log at ${logPath} did not contain parseable First Load JS rows.`);
  }

  return actualRoutes;
}

function printUsage() {
  console.log(`Usage:
  node scripts/first-load-js-baseline.mjs check [--stats <path>] [--log <path>] [--baseline <path>]
  node scripts/first-load-js-baseline.mjs write-baseline [--stats <path>] [--log <path>] [--baseline <path>]

Defaults:
  --baseline  performance/first-load-js-baseline.v1.json (relative to archlucid-ui cwd)
  --stats     .next/diagnostics/route-bundle-stats.json when present (Next 16+)
  --log       legacy Next 15 build console capture`);
}

/**
 * @param {string[]} argv
 * @returns {{ command: string; logPath: string | null; statsPath: string | null; baselinePath: string }}
 */
function parseCli(argv) {
  const command = argv[0];

  if (command === undefined || command === "--help" || command === "-h") {
    return {
      command: "help",
      logPath: null,
      statsPath: null,
      baselinePath: join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH),
    };
  }

  /** @type {string | null} */
  let logPath = null;
  /** @type {string | null} */
  let statsPath = null;
  let baselinePath = join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH);

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--log") {
      logPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--stats") {
      statsPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--baseline") {
      baselinePath = argv[index + 1] ?? baselinePath;
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  if (statsPath === null) {
    const defaultStatsPath = join(process.cwd(), DEFAULT_ROUTE_BUNDLE_STATS_RELATIVE_PATH);

    if (existsSync(defaultStatsPath)) {
      statsPath = defaultStatsPath;
    }
  }

  return { command, logPath, statsPath, baselinePath };
}

function runCheck(statsPath, logPath, baselinePath) {
  const actualRoutes = resolveActualRoutes(statsPath, logPath);
  const baseline = readBaseline(baselinePath);
  const result = compareFirstLoadJsBudget(actualRoutes, baseline);

  for (const message of result.messages) {
    console.log(message);
  }

  if (!result.ok) {
    process.exitCode = 1;
    return;
  }

  const source = statsPath ?? logPath;
  console.log(`First Load JS budget check passed (${baselinePath}; source ${source}).`);
}

function runWriteBaseline(statsPath, logPath, baselinePath) {
  const actualRoutes = resolveActualRoutes(statsPath, logPath);
  const existingBaseline = readBaseline(baselinePath);
  const updated = buildUpdatedBaseline(actualRoutes, existingBaseline);

  writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  console.log(`Updated baseline: ${baselinePath}`);
}

function main() {
  const { command, logPath, statsPath, baselinePath } = parseCli(process.argv.slice(2));

  if (command === "help") {
    printUsage();
    return;
  }

  if (command === "check") {
    runCheck(statsPath, logPath, baselinePath);
    return;
  }

  if (command === "write-baseline") {
    runWriteBaseline(statsPath, logPath, baselinePath);
    return;
  }

  printUsage();
  process.exitCode = 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`ERROR: ${message}`);
    process.exitCode = 1;
  }
}
