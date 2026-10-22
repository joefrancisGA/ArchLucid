import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { findSurfaceMarkerViolations } from "@/lib/error-recovery-contract-guard";
import {
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_COMPONENT_MARKERS,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_CONTEXT_MARKERS,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_DISCOVERY_ROOTS,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_COUNT_BASELINE,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_DOCUMENTED_EXCEPTIONS,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES,
  DECISION_GRADE_SEMANTIC_SUPPORT_BAND_LIST_ROW_MARKERS,
} from "@/lib/findings/decision-grade-semantic-support-band-inventory";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);

const EXCLUDED_FILE_SUFFIXES = [".test.ts", ".test.tsx", ".generated.ts", ".generated.tsx"] as const;

const EXCLUDED_EXACT_RELATIVE_FILES = [
  "lib/findings/decision-grade-semantic-support-band-inventory.ts",
  "lib/findings/decision-grade-semantic-support-band-guard.ts",
  "components/findings/FindingSemanticSupportBandChip.tsx",
  "components/findings/FindingSemanticSupportBandInspectSection.tsx",
  "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailReviewPackageSemanticSupportBandSummary.tsx",
] as const;

export type DecisionGradeSemanticSupportBandGuardViolation = {
  readonly relativePath: string;
  readonly message: string;
};

function shouldExcludeDiscoveryFile(relativePath: string): boolean {
  const normalized = relativePath.replace(/\\/g, "/");

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

    if (shouldExcludeDiscoveryFile(relativePath)) {
      continue;
    }

    results.push(relativePath);
  }
}

function includesAnyMarker(source: string, markers: readonly string[]): boolean {
  return markers.some((marker) => source.includes(marker));
}

function isGuardedSurfacePath(relativePath: string): boolean {
  const guardedRoots = DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES.flatMap(
    (surface) => surface.sourceRoots,
  );

  return guardedRoots.includes(relativePath);
}

export function discoverDecisionGradeFindingListRowPaths(uiRoot: string): string[] {
  const relativePaths: string[] = [];

  for (const discoveryRoot of DECISION_GRADE_SEMANTIC_SUPPORT_BAND_DISCOVERY_ROOTS) {
    walkSourceFiles(join(uiRoot, "src"), discoveryRoot, relativePaths);
  }

  const uniquePaths = [...new Set(relativePaths)].sort();

  return uniquePaths.filter((relativePath) => {
    const source = readFileSync(join(uiRoot, "src", relativePath), "utf8");

    if (!includesAnyMarker(source, DECISION_GRADE_SEMANTIC_SUPPORT_BAND_LIST_ROW_MARKERS)) {
      return false;
    }

    if (!includesAnyMarker(source, DECISION_GRADE_SEMANTIC_SUPPORT_BAND_CONTEXT_MARKERS)) {
      return false;
    }

    return true;
  });
}

export function findDecisionGradeSemanticSupportBandGuardedSurfaceViolations(uiRoot: string) {
  return findSurfaceMarkerViolations(uiRoot, DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES);
}

export function findDecisionGradeSemanticSupportBandDiscoveryViolations(
  uiRoot: string,
): DecisionGradeSemanticSupportBandGuardViolation[] {
  const violations: DecisionGradeSemanticSupportBandGuardViolation[] = [];
  const grandfathered = new Set<string>(DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS);
  const discovered = discoverDecisionGradeFindingListRowPaths(uiRoot);

  for (const relativePath of discovered) {
    if (isGuardedSurfacePath(relativePath)) {
      continue;
    }

    if (grandfathered.has(relativePath)) {
      continue;
    }

    const source = readFileSync(join(uiRoot, "src", relativePath), "utf8");

    if (includesAnyMarker(source, DECISION_GRADE_SEMANTIC_SUPPORT_BAND_COMPONENT_MARKERS)) {
      continue;
    }

    violations.push({
      relativePath,
      message:
        "Decision-grade Working finding row renders without FindingSemanticSupportBandChip (AS-061). Wire the chip or add the path to DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GUARDED_SURFACES.",
    });
  }

  for (const grandfatheredPath of grandfathered) {
    if (!discovered.includes(grandfatheredPath)) {
      violations.push({
        relativePath: grandfatheredPath,
        message:
          "Grandfathered path no longer renders decision-grade finding rows — remove from DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS.",
      });
    }
  }

  return violations;
}

export function findDecisionGradeSemanticSupportBandGrandfatherShrinkViolations(): DecisionGradeSemanticSupportBandGuardViolation[] {
  const violations: DecisionGradeSemanticSupportBandGuardViolation[] = [];
  const grandfathered = [...DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS];
  const maxAllowedCount =
    DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_COUNT_BASELINE
    + DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_DOCUMENTED_EXCEPTIONS.length;

  if (grandfathered.length > maxAllowedCount) {
    violations.push({
      relativePath: "DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHERED_PATHS",
      message:
        `Grandfather inventory grew to ${grandfathered.length} rows (baseline ${DECISION_GRADE_SEMANTIC_SUPPORT_BAND_GRANDFATHER_COUNT_BASELINE}) — wire FindingSemanticSupportBandChip instead of adding exceptions.`,
    });
  }

  return violations;
}

export function findDecisionGradeSemanticSupportBandGuardViolations(
  uiRoot: string,
): DecisionGradeSemanticSupportBandGuardViolation[] {
  const guardedSurfaceViolations = findDecisionGradeSemanticSupportBandGuardedSurfaceViolations(uiRoot).map(
    (violation) => ({
      relativePath: violation.surfaceId,
      message: violation.message,
    }),
  );

  return [
    ...guardedSurfaceViolations,
    ...findDecisionGradeSemanticSupportBandDiscoveryViolations(uiRoot),
    ...findDecisionGradeSemanticSupportBandGrandfatherShrinkViolations(),
  ];
}
