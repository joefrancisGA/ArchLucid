import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { OPERATOR_URL_ROUTER_INLINE_QUERY_WRITER_ALLOWLIST } from "@/lib/operator/operator-url-router-inline-query-writer-allowlist";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

const EXCLUDED_FILE_SUFFIXES = [
  ".test.ts",
  ".test.tsx",
  ".generated.ts",
  ".generated.tsx",
] as const;

const HREF_FROM_SEARCH_EXPORT = /export function \w+HrefFromSearch\b/;

const COMPLIANCE_MARKERS = [
  "buildOperatorHrefFromSearch",
  "applyOperatorUrlSelectionSwitch",
  "operatorBooleanDisclosureHrefFromSearch",
] as const;

const GUARD_SELF_PATHS = new Set([
  "lib/operator/operator-url-href-from-search.ts",
  "lib/operator/operator-url-selection-switch.ts",
  "lib/operator/operator-url-query-writer-guard.ts",
]);

export type OperatorUrlQueryWriterViolation = {
  readonly relativePath: string;
  readonly message: string;
};

function normalizeRelativePath(relativePath: string): string {
  return relativePath.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}

function shouldExcludeFile(relativePath: string): boolean {
  const normalized = normalizeRelativePath(relativePath);

  for (const suffix of EXCLUDED_FILE_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      return true;
    }
  }

  return false;
}

function walkSourceFiles(rootDir: string, relativeDir: string, results: string[]): void {
  const normalizedDir = normalizeRelativePath(relativeDir).replace(/\/$/, "");
  const absoluteDir = join(rootDir, normalizedDir);

  let entries: string[];

  try {
    entries = readdirSync(absoluteDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const relativePath = normalizeRelativePath(
      normalizedDir.length > 0 ? `${normalizedDir}/${entry}` : entry,
    );
    const absolutePath = join(rootDir, relativePath);

    let stat;

    try {
      stat = statSync(absolutePath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      walkSourceFiles(rootDir, relativePath, results);
      continue;
    }

    const extension = entry.includes(".") ? entry.slice(entry.lastIndexOf(".")) : "";

    if (!SOURCE_EXTENSIONS.has(extension) || shouldExcludeFile(relativePath)) {
      continue;
    }

    results.push(relativePath);
  }
}

function fileUsesComplianceMarker(source: string): boolean {
  return COMPLIANCE_MARKERS.some((marker) => source.includes(marker));
}

/** Test hook: every exported HrefFromSearch writer must declare selection-switch routing. */
export function isOperatorHrefFromSearchWriterSourceCompliant(source: string): boolean {
  if (!HREF_FROM_SEARCH_EXPORT.test(source)) {
    return true;
  }

  return fileUsesComplianceMarker(source);
}

export function findOperatorHrefFromSearchWriterViolations(uiRoot: string): OperatorUrlQueryWriterViolation[] {
  const srcRoot = join(uiRoot, "src");
  const relativePaths: string[] = [];
  walkSourceFiles(srcRoot, "", relativePaths);

  const violations: OperatorUrlQueryWriterViolation[] = [];

  for (const relativePath of relativePaths) {
    const normalized = normalizeRelativePath(relativePath);

    if (GUARD_SELF_PATHS.has(normalized)) {
      continue;
    }

    const source = readFileSync(join(srcRoot, normalized), "utf8");

    if (!HREF_FROM_SEARCH_EXPORT.test(source)) {
      continue;
    }

    if (!fileUsesComplianceMarker(source)) {
      violations.push({
        relativePath: normalized,
        message:
          "Operator HrefFromSearch writers must route query mutations through buildOperatorHrefFromSearch, operatorBooleanDisclosureHrefFromSearch, or applyOperatorUrlSelectionSwitch.",
      });
    }
  }

  return violations;
}

const ROUTER_INLINE_QUERY_PATTERN = /router\.(replace|push)\([\s\S]*?new URLSearchParams/;

export function findOperatorRouterInlineQueryWriterViolations(uiRoot: string): OperatorUrlQueryWriterViolation[] {
  const operatorAppRoot = join(uiRoot, "src", "app", "(operator)");
  const relativePaths: string[] = [];
  walkSourceFiles(operatorAppRoot, "", relativePaths);

  const violations: OperatorUrlQueryWriterViolation[] = [];

  for (const relativePath of relativePaths) {
    const normalized = normalizeRelativePath(`app/(operator)/${relativePath}`);
    const allowlisted = OPERATOR_URL_ROUTER_INLINE_QUERY_WRITER_ALLOWLIST.has(normalized);

    if (allowlisted) {
      continue;
    }

    const source = readFileSync(join(uiRoot, "src", normalized), "utf8");

    if (!source.includes("router.replace") && !source.includes("router.push")) {
      continue;
    }

    if (!source.includes("new URLSearchParams")) {
      continue;
    }

    if (fileUsesComplianceMarker(source)) {
      continue;
    }

    violations.push({
      relativePath: normalized,
      message:
        "Operator router.push/replace must not build query strings inline; use a *HrefFromSearch helper that routes through operator-url-selection-switch.",
    });
  }

  return violations;
}

export function findOperatorUrlQueryWriterViolations(uiRoot: string): OperatorUrlQueryWriterViolation[] {
  return [
    ...findOperatorHrefFromSearchWriterViolations(uiRoot),
    ...findOperatorRouterInlineQueryWriterViolations(uiRoot),
  ];
}
