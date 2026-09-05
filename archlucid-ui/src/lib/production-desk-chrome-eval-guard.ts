import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { findSurfaceMarkerViolations } from "@/lib/error-recovery-contract-guard";
import {
  PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS,
  PRODUCTION_DESK_CHROME_EVAL_MIGRATED_SURFACES,
  PRODUCTION_DESK_CHROME_RESOLVER_MARKERS,
} from "@/lib/production-desk-chrome-eval-inventory";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

const EXCLUDED_FILE_SUFFIXES = [".test.ts", ".test.tsx", ".generated.ts", ".generated.tsx"] as const;

const EXCLUDED_RELATIVE_PATH_PREFIXES = [
  "lib/buyer/",
  "components/cto-demo/",
  "testing/",
] as const;

const EXCLUDED_EXACT_RELATIVE_FILES = [
  "lib/demo-ui-env.ts",
  "lib/production-desk-chrome.ts",
  "lib/architect-workspace-chrome.ts",
  "lib/production-desk-chrome-eval-inventory.ts",
  "lib/production-desk-chrome-eval-guard.ts",
] as const;

const BUYER_POLISH_EVAL_PATTERN = "isBuyerPolishedOperatorShellEnv";

export type ProductionDeskChromeEvalGuardViolation = {
  readonly relativePath: string;
  readonly message: string;
};

function shouldExcludeFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

  if (normalized.endsWith("BuyerChrome.tsx")) {
    return true;
  }

  for (const suffix of EXCLUDED_FILE_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      return true;
    }
  }

  for (const exactFile of EXCLUDED_EXACT_RELATIVE_FILES) {
    if (normalized === exactFile) {
      return true;
    }
  }

  for (const prefix of EXCLUDED_RELATIVE_PATH_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

function walkSourceFiles(rootDir: string, relativeDir: string, results: string[]): void {
  const absoluteDir = join(rootDir, relativeDir);
  let entries;

  try {
    entries = readdirSync(absoluteDir);
  }
  catch {
    return;
  }

  for (const entry of entries) {
    const relativePath = relativeDir.length > 0 ? `${relativeDir}/${entry}` : entry;
    const absolutePath = join(rootDir, relativePath);

    let stats;

    try {
      stats = statSync(absolutePath);
    }
    catch {
      continue;
    }

    if (stats.isDirectory()) {
      walkSourceFiles(rootDir, relativePath, results);
      continue;
    }

    const extensionIndex = entry.lastIndexOf(".");

    if (extensionIndex < 0) {
      continue;
    }

    const extension = entry.slice(extensionIndex);

    if (!SOURCE_EXTENSIONS.has(extension)) {
      continue;
    }

    if (shouldExcludeFile(relativePath)) {
      continue;
    }

    results.push(relativePath);
  }
}

function fileUsesBuyerPolishEvalChrome(uiRoot: string, relativePath: string): boolean {
  const source = readFileSync(join(uiRoot, "src", relativePath), "utf8");

  return source.includes(BUYER_POLISH_EVAL_PATTERN);
}

function fileUsesProductionDeskResolver(uiRoot: string, relativePath: string): boolean {
  const source = readFileSync(join(uiRoot, "src", relativePath), "utf8");

  return PRODUCTION_DESK_CHROME_RESOLVER_MARKERS.some((marker) => source.includes(marker));
}

export function discoverBuyerPolishEvalChromeUsagePaths(uiRoot: string): string[] {
  const relativePaths: string[] = [];

  walkSourceFiles(join(uiRoot, "src"), "", relativePaths);

  return relativePaths
    .filter((relativePath) => fileUsesBuyerPolishEvalChrome(uiRoot, relativePath))
    .sort();
}

export function findProductionDeskChromeEvalMigratedSurfaceViolations(uiRoot: string) {
  return findSurfaceMarkerViolations(uiRoot, PRODUCTION_DESK_CHROME_EVAL_MIGRATED_SURFACES);
}

export function findProductionDeskChromeEvalGuardViolations(uiRoot: string): ProductionDeskChromeEvalGuardViolation[] {
  const violations: ProductionDeskChromeEvalGuardViolation[] = [];
  const grandfathered = new Set<string>(PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS);
  const migratedRoots = new Set(
    PRODUCTION_DESK_CHROME_EVAL_MIGRATED_SURFACES.flatMap((surface) => surface.sourceRoots),
  );
  const discovered = discoverBuyerPolishEvalChromeUsagePaths(uiRoot);
  const discoveredSet = new Set(discovered);

  for (const relativePath of discovered) {
    if (migratedRoots.has(relativePath)) {
      continue;
    }

    if (grandfathered.has(relativePath)) {
      continue;
    }

    if (fileUsesProductionDeskResolver(uiRoot, relativePath)) {
      continue;
    }

    violations.push({
      relativePath,
      message:
        "Eval chrome branches on isBuyerPolishedOperatorShellEnv() without production-desk resolver — use useProductionEvalChrome / resolveProductionEvalChrome or add to PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS during migration.",
    });
  }

  for (const grandfatheredPath of grandfathered) {
    if (!discoveredSet.has(grandfatheredPath)) {
      violations.push({
        relativePath: grandfatheredPath,
        message:
          "Grandfathered path no longer uses isBuyerPolishedOperatorShellEnv() — remove from PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS.",
      });
    }
  }

  return violations;
}
