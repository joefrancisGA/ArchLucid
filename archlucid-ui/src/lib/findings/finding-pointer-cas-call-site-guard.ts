import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { FINDING_POINTER_CAS_EXPECTED_VERSION_MARKER } from "@/lib/findings/finding-pointer-cas-inventory";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

const EXCLUDED_FILE_SUFFIXES = [".test.ts", ".test.tsx", ".generated.ts", ".generated.tsx"] as const;

const CALL_SITE_MARKERS = [
  "recordFindingDisposition(",
  "recordFindingDispositionWith401Resume(",
  "recordBulkFindingDisposition(",
] as const;

const ALLOWLISTED_RELATIVE_PATHS = new Set([
  "lib/api/governance-stickiness-api-dispositions.ts",
  "lib/auth/livelihood-mutation-401-resume-replay.ts",
  "lib/findings/finding-expected-current-disposition-row-version.ts",
  "lib/findings/finding-collect-expected-disposition-row-versions.ts",
  "lib/findings/finding-pointer-cas-inventory.ts",
  "lib/findings/finding-pointer-cas-call-site-guard.ts",
]);

export type FindingPointerCasCallSiteViolation = {
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

function fileContainsCallSite(source: string): boolean {
  return CALL_SITE_MARKERS.some((marker) => source.includes(marker));
}

export function findFindingPointerCasCallSiteViolations(uiRoot: string): FindingPointerCasCallSiteViolation[] {
  const srcRoot = join(uiRoot, "src");
  const relativePaths: string[] = [];
  walkSourceFiles(srcRoot, "", relativePaths);

  const violations: FindingPointerCasCallSiteViolation[] = [];

  for (const relativePath of relativePaths) {
    const normalized = normalizeRelativePath(relativePath);

    if (ALLOWLISTED_RELATIVE_PATHS.has(normalized)) {
      continue;
    }

    const source = readFileSync(join(srcRoot, normalized), "utf8");

    if (!fileContainsCallSite(source)) {
      continue;
    }

    if (!source.includes(FINDING_POINTER_CAS_EXPECTED_VERSION_MARKER)) {
      violations.push({
        relativePath: normalized,
        message:
          `Disposition write call site is missing ${FINDING_POINTER_CAS_EXPECTED_VERSION_MARKER} (ADR 0076 CAS token).`,
      });
    }
  }

  return violations;
}
