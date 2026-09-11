import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/** Relative to repository root (parent of archlucid-ui). */
export const CAREER_GRAVITY_UNLABELED_READY_INVENTORY_DOC_PATH =
  "docs/architecture/CAREER_GRAVITY_UNLABELED_READY_INVENTORY.md" as const;

export const CAREER_GRAVITY_UNLABELED_READY_SCAN_MARKERS = [
  "Ready to finalize",
  "PIPELINE_STATUS_LABELS.readyToFinalize",
] as const;

export type CareerGravityUnlabeledReadyLeakClass =
  | "covered"
  | "bypass"
  | "mismatch"
  | "eval-ok";

export type CareerGravityUnlabeledReadyRow = {
  readonly relativePath: string;
  readonly leakClass: CareerGravityUnlabeledReadyLeakClass;
  readonly ownerPrompt: string;
  readonly inLiteralScan: boolean;
};

/**
 * Shrink-only baseline for Ready-literal scan hits (CG-002). Do not raise this number.
 * Drop it when a later prompt removes a literal or moves it behind honesty-only helpers.
 */
export const CAREER_GRAVITY_UNLABELED_READY_SCAN_COUNT_BASELINE = 10;

/** Architecture / review / desk paths named in CG-002. */
export const CAREER_GRAVITY_UNLABELED_READY_ROWS: readonly CareerGravityUnlabeledReadyRow[] = [
  {
    relativePath: "lib/pipeline-status-labels.ts",
    leakClass: "covered",
    ownerPrompt: "CG-004",
    inLiteralScan: true,
  },
  {
    relativePath: "lib/runs/run-pipeline-status-presentation.ts",
    leakClass: "covered",
    ownerPrompt: "CG-031",
    inLiteralScan: true,
  },
  {
    relativePath: "components/runs/use-run-progress-tracker.ts",
    leakClass: "covered",
    ownerPrompt: "CG-032",
    inLiteralScan: true,
  },
  {
    relativePath: "components/reviews/PreFinalizeChecklistPanel.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-030",
    inLiteralScan: true,
  },
  {
    relativePath: "lib/enterprise-status-kind-resolver.ts",
    leakClass: "covered",
    ownerPrompt: "CG-004",
    inLiteralScan: true,
  },
  {
    relativePath: "lib/runs/run-work-queue-groups.ts",
    leakClass: "covered",
    ownerPrompt: "CG-087",
    inLiteralScan: true,
  },
  {
    relativePath: "lib/first-pilot-operating-rail-status.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-085",
    inLiteralScan: true,
  },
  {
    relativePath: "lib/first-pilot-command-center-phase.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-085",
    inLiteralScan: true,
  },
  {
    relativePath: "hooks/use-review-presenter-elicitation.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-049",
    inLiteralScan: true,
  },
  {
    relativePath: "lib/resolve-core-pilot-help-workflow-step-status.ts",
    leakClass: "eval-ok",
    ownerPrompt: "CG-053",
    inLiteralScan: true,
  },
  {
    relativePath: "components/runs/RunStatusBadge.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-031",
    inLiteralScan: false,
  },
  {
    relativePath: "components/runs/RunProgressTracker.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-032",
    inLiteralScan: false,
  },
  {
    relativePath: "components/reviews/RunDetailPreFinalizeGateHonestyStrip.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-030",
    inLiteralScan: false,
  },
  {
    relativePath: "lib/governance/simulator-career-honesty.ts",
    leakClass: "covered",
    ownerPrompt: "CG-021",
    inLiteralScan: false,
  },
  {
    relativePath: "lib/governance/working-career-rehearsal-door.ts",
    leakClass: "mismatch",
    ownerPrompt: "CG-020",
    inLiteralScan: false,
  },
  {
    relativePath: "lib/provenance-review-context.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-088",
    inLiteralScan: false,
  },
  {
    relativePath:
      "app/(operator)/architecture/first-review-guide/_sections/FirstReviewGuideWalkthrough.tsx",
    leakClass: "covered",
    ownerPrompt: "CG-091",
    inLiteralScan: false,
  },
  {
    relativePath: "lib/i18n.ts",
    leakClass: "bypass",
    ownerPrompt: "CG-033",
    inLiteralScan: false,
  },
] as const;

const SKIP_DIRECTORY_NAMES = new Set(["node_modules", ".next"]);

function shouldSkipScannedFile(fileName: string): boolean {
  if (fileName.includes(".test.") || fileName.includes(".spec.")) {
    return true;
  }

  // Skip generated OpenAPI snapshots — they are not Working chrome.
  if (fileName.includes("generated") || fileName.includes("master-baseline")) {
    return true;
  }

  // This module stores the scan markers as string literals.
  if (fileName === "career-gravity-unlabeled-ready-inventory.ts") {
    return true;
  }

  return false;
}

function walkUiSourceFiles(directory: string, root: string, hits: string[]): void {
  const entries = readdirSync(directory);

  for (const name of entries) {
    if (SKIP_DIRECTORY_NAMES.has(name)) {
      continue;
    }

    const fullPath = join(directory, name);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walkUiSourceFiles(fullPath, root, hits);
      continue;
    }

    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) {
      continue;
    }

    if (shouldSkipScannedFile(name)) {
      continue;
    }

    const source = readFileSync(fullPath, "utf8");
    const isHit = CAREER_GRAVITY_UNLABELED_READY_SCAN_MARKERS.some((marker) =>
      source.includes(marker),
    );

    if (!isHit) {
      continue;
    }

    hits.push(relative(root, fullPath).replaceAll("\\", "/"));
  }
}

/** Ready-literal paths under `archlucid-ui/src` (posix, relative to `src`). */
export function discoverCareerGravityUnlabeledReadyScanPaths(uiSrcRoot: string): string[] {
  const hits: string[] = [];

  walkUiSourceFiles(uiSrcRoot, uiSrcRoot, hits);

  return hits.sort();
}
