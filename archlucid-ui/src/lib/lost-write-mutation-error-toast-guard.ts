import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  LOST_WRITE_MUTATION_ERROR_TOAST_INVENTORY,
  type LostWriteMutationErrorToastRow,
} from "@/lib/lost-write-mutation-error-toast-inventory";

export type LostWriteMutationErrorToastViolation = {
  readonly surfaceId: string;
  readonly message: string;
};

const FORBIDDEN_TOAST_LINE_PATTERN = /\b(?:showError|toast\.error)\s*\(/;

const REQUIRED_STICKY_MARKERS = ["showMutationError", "showMutationApiError", "showMutationSonnerError"] as const;

function readSource(uiRoot: string, relativePath: string): string {
  return readFileSync(join(uiRoot, "src", relativePath), "utf8");
}

function lineMatchesAllowedPattern(line: string, row: LostWriteMutationErrorToastRow): boolean {
  const patterns = row.allowedTransientToastLinePatterns ?? [];

  return patterns.some((pattern) => pattern.test(line));
}

function findForbiddenToastLines(source: string, row: LostWriteMutationErrorToastRow): string[] {
  const forbiddenLines: string[] = [];

  for (const line of source.split(/\r?\n/)) {
    if (!FORBIDDEN_TOAST_LINE_PATTERN.test(line)) {
      continue;
    }

    if (lineMatchesAllowedPattern(line, row)) {
      continue;
    }

    forbiddenLines.push(line.trim());
  }

  return forbiddenLines;
}

export function findLostWriteMutationErrorToastViolations(uiRoot: string): LostWriteMutationErrorToastViolation[] {
  const violations: LostWriteMutationErrorToastViolation[] = [];

  for (const row of LOST_WRITE_MUTATION_ERROR_TOAST_INVENTORY) {
    const combinedSource = row.sourceRoots.map((root) => readSource(uiRoot, root)).join("\n");

    if (!REQUIRED_STICKY_MARKERS.some((marker) => combinedSource.includes(marker))) {
      violations.push({
        surfaceId: row.id,
        message: `Expected showMutationError or showMutationApiError in ${row.sourceRoots.join(", ")}.`,
      });
    }

    for (const forbiddenLine of findForbiddenToastLines(combinedSource, row)) {
      violations.push({
        surfaceId: row.id,
        message: `Forbidden transient mutation error toast: ${forbiddenLine}`,
      });
    }
  }

  return violations;
}
