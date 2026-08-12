import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  REPORT_PROBLEM_V1_SURFACES,
  type ReportProblemSurfaceEntry,
} from "@/lib/report-problem-surfaces";

export type ReportProblemSurfaceGuardViolation = {
  readonly surfaceId: string;
  readonly message: string;
};

/** Wiring markers that must appear in registry component source roots (TB-791). */
export type ReportProblemSurfaceWiringRule = {
  readonly surfaceId: string;
  readonly requiredMarkers: readonly string[];
  /** Extra roots beyond `componentPath` (e.g. shared failure views). */
  readonly additionalSourceRoots?: readonly string[];
};

export const REPORT_PROBLEM_SURFACE_WIRING_RULES: readonly ReportProblemSurfaceWiringRule[] = [
  {
    surfaceId: "reviews-hub-unexpected-response",
    requiredMarkers: ["reviews-hub-unexpected-response", "FatalPageReportProblemSupportRow"],
  },
  {
    surfaceId: "review-detail-hard-load-failure",
    requiredMarkers: ["review-detail-hard-load-failure"],
    additionalSourceRoots: [
      "components/ReviewPackageLoadFailureView.tsx",
      "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPageFetchErrorView.tsx",
      "app/(operator)/architecture/reviews/[runId]/_sections/RunDetailPageMalformedResponseView.tsx",
      "app/(operator)/architecture/reviews/[runId]/error.tsx",
    ],
  },
  {
    surfaceId: "executive-value-report-load-failure",
    requiredMarkers: ["OperatorApiProblem"],
    additionalSourceRoots: ["app/(operator)/insights/pilot-outcomes/_sections/PilotValueReportPageView.tsx"],
  },
  {
    surfaceId: "governance-findings-queue-hard-failure",
    requiredMarkers: ["governance-findings-queue-hard-failure", "FatalPageReportProblemSupportRow"],
  },
  {
    surfaceId: "review-commit-export-page-failure",
    requiredMarkers: ["OperatorApiProblem", "review-commit-export-page-failure"],
    additionalSourceRoots: ["app/(operator)/architecture/reviews/[runId]/_sections/RunDetailArtifactsExportsSection.tsx"],
  },
  {
    surfaceId: "operator-api-problem-high-stakes",
    requiredMarkers: ["OperatorReportProblemAction", "isReportProblemEnabledForApiProblemFailure"],
  },
  {
    surfaceId: "operator-layered-connectivity-error",
    requiredMarkers: ["OperatorReportProblemAction", "isReportProblemEnabledForConnectivityError"],
  },
  {
    surfaceId: "operator-role-gate-session-break",
    requiredMarkers: ["operator-role-gate-session-break", "FatalPageReportProblemSupportRow"],
  },
] as const;

const REPORT_PROBLEM_AFFORDANCE_MARKERS = [
  "report-problem-trigger",
  "FatalPageReportProblemSupportRow",
  "OperatorReportProblemAction",
] as const;

/** Operator error-ish sources scanned by the optional mailto drift guard (warn-only). */
export const REPORT_PROBLEM_MAILTO_DRIFT_SCAN_ROOTS = [
  "src/app/(operator)",
  "src/components/operator/OperatorApiProblem.tsx",
  "src/components/operator/OperatorLayeredConnectivityError.tsx",
  "src/components/operator/OperatorBrandedTransientFailure.tsx",
  "src/components/ReviewPackageLoadFailureView.tsx",
  "src/components/operator/OperatorAccessDeniedPageClient.tsx",
] as const;

export function collectTsxSourceFiles(absoluteRoot: string): string[] {
  if (!existsSync(absoluteRoot)) {
    return [];
  }

  const stat = statSync(absoluteRoot);

  if (stat.isFile()) {
    return absoluteRoot.endsWith(".tsx") ? [absoluteRoot] : [];
  }

  const files: string[] = [];

  for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
    const childPath = join(absoluteRoot, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectTsxSourceFiles(childPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(childPath);
    }
  }

  return files;
}

function isNodeErrno(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  );
}

export function readSurfaceSourceBundle(uiRoot: string, relativePath: string): string {
  const absolutePath = join(uiRoot, "src", relativePath);

  try {
    return readFileSync(absolutePath, "utf8");
  } catch (error) {
    if (isNodeErrno(error, "ENOENT")) {
      return "";
    }
  }

  try {
    return collectTsxSourceFiles(absolutePath)
      .map((filePath) => readFileSync(filePath, "utf8"))
      .join("\n");
  } catch {
    return "";
  }
}

export function registryComponentPathExists(uiRoot: string, entry: ReportProblemSurfaceEntry): boolean {
  const absolutePath = join(uiRoot, "src", entry.componentPath);

  return existsSync(absolutePath);
}

export function findReportProblemSurfaceGuardViolations(uiRoot: string): ReportProblemSurfaceGuardViolation[] {
  const violations: ReportProblemSurfaceGuardViolation[] = [];

  for (const entry of REPORT_PROBLEM_V1_SURFACES) {
    if (!registryComponentPathExists(uiRoot, entry)) {
      violations.push({
        surfaceId: entry.id,
        message: `Registry componentPath missing on disk: src/${entry.componentPath}`,
      });
    }
  }

  for (const rule of REPORT_PROBLEM_SURFACE_WIRING_RULES) {
    const registryEntry = REPORT_PROBLEM_V1_SURFACES.find((surface) => surface.id === rule.surfaceId);

    if (registryEntry === undefined) {
      violations.push({
        surfaceId: rule.surfaceId,
        message: "Wiring rule references unknown registry surface id.",
      });
      continue;
    }

    const roots = [registryEntry.componentPath, ...(rule.additionalSourceRoots ?? [])];
    const combinedSource = roots.map((root) => readSurfaceSourceBundle(uiRoot, root)).join("\n");

    for (const marker of rule.requiredMarkers) {
      if (!combinedSource.includes(marker)) {
        violations.push({
          surfaceId: rule.surfaceId,
          message: `Expected wiring marker "${marker}" in registry component sources.`,
        });
      }
    }
  }

  return violations;
}

export type ReportProblemMailtoDriftFinding = {
  readonly relativePath: string;
  readonly line: number;
};

export function findReportProblemMailtoDriftFindings(uiRoot: string): ReportProblemMailtoDriftFinding[] {
  const findings: ReportProblemMailtoDriftFinding[] = [];

  for (const scanRoot of REPORT_PROBLEM_MAILTO_DRIFT_SCAN_ROOTS) {
    const absoluteRoot = join(uiRoot, scanRoot);

    for (const filePath of collectTsxSourceFiles(absoluteRoot)) {
      const source = readFileSync(filePath, "utf8");
      const relativePath = filePath.slice(uiRoot.length + 1).replace(/\\/g, "/");

      if (!source.includes("mailto:")) {
        continue;
      }

      const lines = source.split(/\r?\n/);

      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]!;

        if (!line.includes("mailto:")) {
          continue;
        }

        const windowStart = Math.max(0, index - 12);
        const windowEnd = Math.min(lines.length, index + 13);
        const nearby = lines.slice(windowStart, windowEnd).join("\n");
        const hasReportProblemAffordance = REPORT_PROBLEM_AFFORDANCE_MARKERS.some((marker) =>
          nearby.includes(marker),
        );

        if (!hasReportProblemAffordance) {
          findings.push({ relativePath, line: index + 1 });
        }
      }
    }
  }

  return findings;
}
