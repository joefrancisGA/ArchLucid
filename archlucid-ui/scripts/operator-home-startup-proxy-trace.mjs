/**
 * TB-2304 (performance) — Compare operator-home cold-start proxy traces against a committed baseline.
 * Distinct from vocabulary rail TB-2304 in package-governance-approval-queue-vocabulary.ts.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** @typedef {{ schemaVersion: number; updatedUtc: string; route: string; regressionToleranceExtraRequests: number; maxTotalProxyRequests: number; paths: Record<string, { minCount?: number; maxCount: number }>; shellStatusHydratedMaxCount: number; shellStatusHydratedPaths: readonly string[]; tb2302BootstrapBundlingGoNoGo: string; tb2302BootstrapBundlingRationale: string; notes?: string }} OperatorHomeStartupProxyTraceBaseline */

/** @typedef {{ path: string; method?: string; startedAtMs?: number }} ProxyTraceEntry */

/** @typedef {{ capturedUtc?: string; route?: string; entries: readonly ProxyTraceEntry[] }} ProxyTraceCapture */

export const DEFAULT_BASELINE_RELATIVE_PATH = join(
  "performance",
  "operator-home-startup-proxy-trace-baseline.v1.json",
);

/**
 * Normalizes UI proxy URLs to API-relative paths used in OpenAPI (`/v1/...`, `/health/...`).
 * @param {string} rawPath
 * @returns {string}
 */
export function normalizeProxyApiPath(rawPath) {
  const withoutQuery = rawPath.split("?")[0] ?? rawPath;

  if (withoutQuery.startsWith("/api/proxy/v1/")) {
    return withoutQuery.replace("/api/proxy", "");
  }

  if (withoutQuery.startsWith("/api/proxy/health/")) {
    return withoutQuery.replace("/api/proxy", "");
  }

  if (withoutQuery.startsWith("/v1/") || withoutQuery.startsWith("/health/")) {
    return withoutQuery;
  }

  return withoutQuery;
}

/**
 * @param {readonly ProxyTraceEntry[]} entries
 * @returns {Map<string, number>}
 */
export function countNormalizedProxyPaths(entries) {
  /** @type {Map<string, number>} */
  const counts = new Map();

  for (const entry of entries) {
    if (typeof entry.path !== "string" || entry.path.length === 0) {
      continue;
    }

    const normalizedPath = normalizeProxyApiPath(entry.path);
    counts.set(normalizedPath, (counts.get(normalizedPath) ?? 0) + 1);
  }

  return counts;
}

/**
 * @param {readonly ProxyTraceEntry[]} entries
 * @returns {number}
 */
export function countShellStatusHydratedRequests(entries, hydratedPaths) {
  const counts = countNormalizedProxyPaths(entries);
  let total = 0;

  for (const path of hydratedPaths) {
    total += counts.get(path) ?? 0;
  }

  return total;
}

/**
 * @param {string} baselinePath
 * @returns {OperatorHomeStartupProxyTraceBaseline}
 */
export function readBaseline(baselinePath) {
  const raw = readFileSync(baselinePath, "utf8");
  /** @type {OperatorHomeStartupProxyTraceBaseline} */
  const baseline = JSON.parse(raw);

  if (baseline.schemaVersion !== 1) {
    throw new Error(`Unsupported baseline schemaVersion: ${baseline.schemaVersion}`);
  }

  if (typeof baseline.maxTotalProxyRequests !== "number" || baseline.maxTotalProxyRequests < 0) {
    throw new Error("Baseline maxTotalProxyRequests must be a non-negative number.");
  }

  if (
    typeof baseline.regressionToleranceExtraRequests !== "number" ||
    baseline.regressionToleranceExtraRequests < 0
  ) {
    throw new Error("Baseline regressionToleranceExtraRequests must be a non-negative number.");
  }

  if (!Array.isArray(baseline.shellStatusHydratedPaths)) {
    throw new Error("Baseline shellStatusHydratedPaths must be an array.");
  }

  return baseline;
}

/**
 * @param {string} tracePath
 * @returns {ProxyTraceCapture}
 */
export function readTraceCapture(tracePath) {
  const raw = readFileSync(tracePath, "utf8");
  /** @type {ProxyTraceCapture} */
  const capture = JSON.parse(raw);

  if (!Array.isArray(capture.entries)) {
    throw new Error(`Trace capture must include entries[]: ${tracePath}`);
  }

  return capture;
}

/**
 * @param {readonly ProxyTraceEntry[]} entries
 * @param {OperatorHomeStartupProxyTraceBaseline} baseline
 * @returns {{ ok: boolean; messages: string[] }}
 */
export function compareOperatorHomeProxyTrace(entries, baseline) {
  /** @type {string[]} */
  const messages = [];
  let ok = true;

  const pathCounts = countNormalizedProxyPaths(entries);
  let totalRequests = 0;

  for (const count of pathCounts.values()) {
    totalRequests += count;
  }

  const totalCeiling = baseline.maxTotalProxyRequests + baseline.regressionToleranceExtraRequests;

  if (totalRequests > totalCeiling) {
    ok = false;
    messages.push(
      `FAIL: total proxy requests ${totalRequests} exceed budget ${baseline.maxTotalProxyRequests} + tolerance ${baseline.regressionToleranceExtraRequests}.`,
    );
  } else {
    messages.push(
      `OK: total proxy requests ${totalRequests} (budget ${baseline.maxTotalProxyRequests} + tolerance ${baseline.regressionToleranceExtraRequests}).`,
    );
  }

  for (const [path, limits] of Object.entries(baseline.paths)) {
    const actual = pathCounts.get(path) ?? 0;
    const minCount = limits.minCount ?? 0;

    if (actual < minCount) {
      ok = false;
      messages.push(`FAIL: ${path} count ${actual} below minimum ${minCount}.`);
      continue;
    }

    if (actual > limits.maxCount) {
      ok = false;
      messages.push(`FAIL: ${path} count ${actual} exceeds maximum ${limits.maxCount}.`);
      continue;
    }

    messages.push(`OK: ${path} count ${actual} (allowed ${minCount}–${limits.maxCount}).`);
  }

  const hydratedCount = countShellStatusHydratedRequests(entries, baseline.shellStatusHydratedPaths);

  if (hydratedCount > baseline.shellStatusHydratedMaxCount) {
    ok = false;
    messages.push(
      `FAIL: shell-status hydrated duplicate GETs ${hydratedCount} exceed max ${baseline.shellStatusHydratedMaxCount}.`,
    );
  } else {
    messages.push(
      `OK: shell-status hydrated duplicate GETs ${hydratedCount} (max ${baseline.shellStatusHydratedMaxCount}).`,
    );
  }

  messages.push(
    `INFO: TB-2302 bootstrap bundling go/no-go = ${baseline.tb2302BootstrapBundlingGoNoGo} — ${baseline.tb2302BootstrapBundlingRationale}`,
  );

  return { ok, messages };
}

/**
 * @param {readonly ProxyTraceEntry[]} entries
 * @param {OperatorHomeStartupProxyTraceBaseline} existingBaseline
 * @returns {OperatorHomeStartupProxyTraceBaseline}
 */
export function buildUpdatedBaselineFromTrace(entries, existingBaseline) {
  const pathCounts = countNormalizedProxyPaths(entries);
  /** @type {Record<string, { minCount?: number; maxCount: number }>} */
  const paths = { ...existingBaseline.paths };

  for (const path of Object.keys(paths)) {
    const actual = pathCounts.get(path) ?? 0;
    paths[path] = { minCount: actual, maxCount: actual };
  }

  let totalRequests = 0;

  for (const count of pathCounts.values()) {
    totalRequests += count;
  }

  return {
    ...existingBaseline,
    schemaVersion: 1,
    updatedUtc: new Date().toISOString(),
    maxTotalProxyRequests: totalRequests,
    paths,
    shellStatusHydratedMaxCount: countShellStatusHydratedRequests(
      entries,
      existingBaseline.shellStatusHydratedPaths,
    ),
  };
}

function printUsage() {
  console.log(`Usage:
  node scripts/operator-home-startup-proxy-trace.mjs check --trace <path> [--baseline <path>]
  node scripts/operator-home-startup-proxy-trace.mjs write-baseline --trace <path> [--baseline <path>]

Defaults:
  --baseline  performance/operator-home-startup-proxy-trace-baseline.v1.json (relative to archlucid-ui cwd)`);
}

/**
 * @param {string[]} argv
 * @returns {{ command: string; tracePath: string | null; baselinePath: string }}
 */
function parseCli(argv) {
  const command = argv[0];

  if (command === undefined || command === "--help" || command === "-h") {
    return {
      command: "help",
      tracePath: null,
      baselinePath: join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH),
    };
  }

  /** @type {string | null} */
  let tracePath = null;
  let baselinePath = join(process.cwd(), DEFAULT_BASELINE_RELATIVE_PATH);

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--trace") {
      tracePath = argv[index + 1] ?? null;
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

  return { command, tracePath, baselinePath };
}

function runCheck(tracePath, baselinePath) {
  if (tracePath === null || !existsSync(tracePath)) {
    throw new Error("check requires --trace <path> to an existing JSON capture.");
  }

  const capture = readTraceCapture(tracePath);
  const baseline = readBaseline(baselinePath);
  const result = compareOperatorHomeProxyTrace(capture.entries, baseline);

  for (const message of result.messages) {
    console.log(message);
  }

  if (!result.ok) {
    process.exitCode = 1;
    return;
  }

  console.log(`Operator home proxy trace check passed (${baselinePath}; trace ${tracePath}).`);
}

function runWriteBaseline(tracePath, baselinePath) {
  if (tracePath === null || !existsSync(tracePath)) {
    throw new Error("write-baseline requires --trace <path> to an existing JSON capture.");
  }

  const capture = readTraceCapture(tracePath);
  const existingBaseline = readBaseline(baselinePath);
  const updated = buildUpdatedBaselineFromTrace(capture.entries, existingBaseline);

  writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`, "utf8");
  console.log(`Updated baseline: ${baselinePath}`);
}

function main() {
  const { command, tracePath, baselinePath } = parseCli(process.argv.slice(2));

  if (command === "help") {
    printUsage();
    return;
  }

  if (command === "check") {
    runCheck(tracePath, baselinePath);
    return;
  }

  if (command === "write-baseline") {
    runWriteBaseline(tracePath, baselinePath);
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
