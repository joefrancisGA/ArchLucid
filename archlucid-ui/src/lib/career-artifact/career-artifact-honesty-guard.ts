import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  CAREER_ARTIFACT_COMPLETENESS_MODULE_IMPORT,
  CAREER_ARTIFACT_COMPLETENESS_SYMBOL,
  CAREER_ARTIFACT_HONESTY_MODULE_IMPORT,
  CAREER_ARTIFACT_HONESTY_REQUIRED_SYMBOLS,
  CAREER_ARTIFACT_HONESTY_UI_SURFACES,
  CAREER_EXPORT_HONESTY_MODULE_IMPORT,
  CAREER_EXPORT_FORMATTER_PATHS,
  CAREER_EXPORT_HONESTY_REQUIRED_SYMBOLS,
  CAREER_EXPORT_MOUNTED_UI_PATHS,
} from "@/lib/career-export-mounted-ui-paths";
import {
  CAREER_ARTIFACT_HONESTY_GRANDFATHER_WAIVER_MARKER,
  CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS,
} from "@/lib/career-artifact/career-artifact-honesty-grandfather-inventory";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

export type CareerArtifactHonestyGuardViolation = {
  readonly relativePath: string;
  readonly message: string;
};

function readSource(uiRoot: string, relativePath: string): string {
  return readFileSync(join(uiRoot, "src", relativePath), "utf8");
}

function fileUsesCareerExportCoverageHonesty(contents: string): boolean {
  if (!contents.includes(CAREER_EXPORT_HONESTY_MODULE_IMPORT)) {
    return false;
  }

  return CAREER_EXPORT_HONESTY_REQUIRED_SYMBOLS.some((symbol) => contents.includes(symbol));
}

function fileUsesCareerArtifactCompleteness(contents: string): boolean {
  if (contents.includes(CAREER_ARTIFACT_COMPLETENESS_SYMBOL)) {
    return true;
  }

  if (!contents.includes(CAREER_ARTIFACT_COMPLETENESS_MODULE_IMPORT)
    && !contents.includes(CAREER_EXPORT_HONESTY_MODULE_IMPORT)) {
    return false;
  }

  return contents.includes(CAREER_ARTIFACT_COMPLETENESS_SYMBOL);
}

function fileUsesCareerArtifactHonestySurface(contents: string): boolean {
  if (!contents.includes(CAREER_ARTIFACT_HONESTY_MODULE_IMPORT)
    && !contents.includes(CAREER_EXPORT_HONESTY_MODULE_IMPORT)) {
    return false;
  }

  return CAREER_ARTIFACT_HONESTY_REQUIRED_SYMBOLS.some((symbol) => contents.includes(symbol));
}

export function findCareerExportFormatterViolations(uiRoot: string): CareerArtifactHonestyGuardViolation[] {
  const violations: CareerArtifactHonestyGuardViolation[] = [];
  const grandfathered = new Set<string>(CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS);

  for (const relativePath of CAREER_EXPORT_FORMATTER_PATHS) {
    const contents = readSource(uiRoot, relativePath);

    if (grandfathered.has(relativePath)) {
      continue;
    }

    const usesSealedManifestJsonHonesty = relativePath === "lib/sealed-manifest-json-export.ts";

    if (!usesSealedManifestJsonHonesty && !fileUsesCareerExportCoverageHonesty(contents)) {
      violations.push({
        relativePath,
        message:
          "Career export formatter must import shared career export coverage honesty helpers or be grandfathered with FC-0078-WAIVER.",
      });
      continue;
    }

    if (!fileUsesCareerArtifactCompleteness(contents)) {
      violations.push({
        relativePath,
        message:
          "Career export formatter must call evaluateCareerArtifactHonesty() (FC-06) or be listed in CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS with FC-0078-WAIVER.",
      });
    }
  }

  return violations;
}

export function findCareerArtifactHonestySurfaceViolations(uiRoot: string): CareerArtifactHonestyGuardViolation[] {
  const violations: CareerArtifactHonestyGuardViolation[] = [];

  for (const relativePath of CAREER_ARTIFACT_HONESTY_UI_SURFACES) {
    const contents = readSource(uiRoot, relativePath);

    if (!fileUsesCareerArtifactHonestySurface(contents)) {
      violations.push({
        relativePath,
        message:
          "Career artifact honesty surface must import evaluateCareerArtifactHonesty from the ADR 0078 module (FC-02).",
      });
    }
  }

  return violations;
}

function hasGrandfatherWaiverComment(inventorySource: string, relativePath: string): boolean {
  const lines = inventorySource.split("\n");
  const pathLineIndex = lines.findIndex((line) => line.includes(`"${relativePath}"`));

  if (pathLineIndex < 0) {
    return false;
  }

  for (let index = pathLineIndex - 1; index >= Math.max(0, pathLineIndex - 6); index -= 1) {
    if (lines[index]?.includes(CAREER_ARTIFACT_HONESTY_GRANDFATHER_WAIVER_MARKER)) {
      return true;
    }
  }

  return false;
}

export function findCareerArtifactHonestyGrandfatherViolations(
  uiRoot: string,
  inventorySource: string,
): CareerArtifactHonestyGuardViolation[] {
  const violations: CareerArtifactHonestyGuardViolation[] = [];
  const grandfathered = new Set<string>(CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS);

  for (const relativePath of CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS) {
    if (!hasGrandfatherWaiverComment(inventorySource, relativePath)) {
      violations.push({
        relativePath,
        message:
          "Grandfathered path must include an FC-0078-WAIVER comment immediately above its inventory entry (FC-07).",
      });
    }

    const contents = readSource(uiRoot, relativePath);

    if (fileUsesCareerArtifactCompleteness(contents)) {
      violations.push({
        relativePath,
        message:
          "Grandfathered path now calls evaluateCareerArtifactHonesty() — remove from CAREER_ARTIFACT_HONESTY_GRANDFATHERED_PATHS.",
      });
    }
  }

  for (const relativePath of CAREER_EXPORT_MOUNTED_UI_PATHS) {
    if (grandfathered.has(relativePath)) {
      continue;
    }

    const contents = readSource(uiRoot, relativePath);
    const isFormatter = (CAREER_EXPORT_FORMATTER_PATHS as readonly string[]).includes(relativePath);
    const isHonestySurface = (CAREER_ARTIFACT_HONESTY_UI_SURFACES as readonly string[]).includes(relativePath);

    if (isFormatter
      && relativePath !== "lib/sealed-manifest-json-export.ts"
      && !fileUsesCareerExportCoverageHonesty(contents)) {
      violations.push({
        relativePath,
        message: "Mounted career export formatter missing coverage honesty wiring — register or grandfather.",
      });
    }

    if (isHonestySurface && !fileUsesCareerArtifactHonestySurface(contents)) {
      violations.push({
        relativePath,
        message: "Mounted career artifact honesty surface missing evaluateCareerArtifactHonesty wiring.",
      });
    }
  }

  return violations;
}

const EXCLUDED_SUFFIXES = [".test.ts", ".test.tsx", ".generated.ts", ".generated.tsx"] as const;

function shouldExcludeInventoryScan(relativePath: string): boolean {
  for (const suffix of EXCLUDED_SUFFIXES) {
    if (relativePath.endsWith(suffix)) {
      return true;
    }
  }

  return relativePath.includes("/career-artifact/")
    || relativePath.startsWith("lib/career-export-mounted-ui-paths")
    || relativePath.startsWith("lib/career-export-coverage-honesty")
    || relativePath.startsWith("lib/career-export-finding-inventory");
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

    if (!SOURCE_EXTENSIONS.has(extension) || shouldExcludeInventoryScan(relativePath)) {
      continue;
    }

    results.push(relativePath);
  }
}

/** FC-04: discover career export call sites that must register in career-export-mounted-ui-paths. */
export function discoverUnregisteredCareerExportMountedPaths(uiRoot: string): string[] {
  const relativePaths: string[] = [];

  walkSourceFiles(join(uiRoot, "src"), "", relativePaths);

  const registered = new Set<string>(CAREER_EXPORT_MOUNTED_UI_PATHS);
  const discovered: string[] = [];

  for (const relativePath of relativePaths) {
    const contents = readSource(uiRoot, relativePath);

    if (!fileUsesCareerExportCoverageHonesty(contents)
      && !fileUsesCareerArtifactHonestySurface(contents)) {
      continue;
    }

    if (registered.has(relativePath)) {
      continue;
    }

    discovered.push(relativePath);
  }

  return discovered.sort();
}
