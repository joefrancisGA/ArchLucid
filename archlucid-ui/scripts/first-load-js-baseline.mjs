/**
 * TB-573 — Parse Next.js production build output and compare First Load JS against a committed baseline.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** @typedef {{ schemaVersion: number; updatedUtc: string; regressionToleranceKb: number; routes: Record<string, { firstLoadJsKb: number }>; notes?: string }} FirstLoadJsBaseline */

export const DEFAULT_BASELINE_RELATIVE_PATH = join("performance", "first-load-js-baseline.v1.json");

/** Routes tracked for UI performance regression gates (TB-573). */
export const TRACKED_ROUTES = [
  "/welcome",
  "/reviews",
  "/reviews/[runId]",
  "/governance",
];

const ROUTE_LINE =
  /(\/[A-Za-z0-9[\]/_\-]+)\s+[\d.]+\s+(?:kB|B)\s+([\d.]+)\s+kB/;

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

function printUsage() {
  console.log(`Usage:
  node scripts/first-load-js-baseline.mjs check [--log <path>] [--baseline <path>]
  node scripts/first-load-js-baseline.mjs write-baseline [--log <path>] [--baseline <path>]

Defaults:
  --baseline  performance/first-load-js-baseline.v1.json (relative to archlucid-ui cwd)
  --log       required for both commands`);
}

/**
 * @param {string[]} argv
 * @returns {{ command: string; logPath: string | null; baselinePath: string }}
 */
function parseCli(argv) {
  const command = argv[0];

  if (command === undefined || command === "--help" || command === "-h") {
    return { command: "help", logPath: null, baselinePath: join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH) };
  }

  /** @type {string | null} */
  let logPath = null;
  let baselinePath = join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH);

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--log") {
      logPath = argv[index + 1] ?? null;
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

  return { command, logPath, baselinePath };
}

function runCheck(logPath, baselinePath) {
  if (logPath === null) {
    throw new Error("check requires --log <path> (capture `npm run build 2>&1 | tee .next-build.log`).");
  }

  const buildLog = readBuildLog(logPath);
  const actualRoutes = parseNextBuildFirstLoadJsKb(buildLog);
  const baseline = readBaseline(baselinePath);
  const result = compareFirstLoadJsBudget(actualRoutes, baseline);

  for (const message of result.messages) {
    console.log(message);
  }

  if (!result.ok) {
    process.exitCode = 1;
    return;
  }

  console.log(`First Load JS budget check passed (${baselinePath}).`);
}

function runWriteBaseline(logPath, baselinePath) {
  if (logPath === null) {
    throw new Error("write-baseline requires --log <path> (capture `npm run build 2>&1 | tee .next-build.log`).");
  }

  const buildLog = readBuildLog(logPath);
  const actualRoutes = parseNextBuildFirstLoadJsKb(buildLog);
  const existingBaseline = readBaseline(baselinePath);
  const updated = buildUpdatedBaseline(actualRoutes, existingBaseline);

  writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  console.log(`Updated baseline: ${baselinePath}`);
}

function main() {
  const { command, logPath, baselinePath } = parseCli(process.argv.slice(2));

  if (command === "help") {
    printUsage();
    return;
  }

  if (command === "check") {
    runCheck(logPath, baselinePath);
    return;
  }

  if (command === "write-baseline") {
    runWriteBaseline(logPath, baselinePath);
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
