import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import type { Mock } from "vitest";
import { expect } from "vitest";

import {
  DURABLE_ACTION_OUTCOME_GLOBAL_ALLOWED_TOAST_LINE_PATTERNS,
  DURABLE_ACTION_OUTCOME_GUARDED_SURFACES,
  DURABLE_ACTION_OUTCOME_HIGH_STAKES_COPY_EXPORTS,
  DURABLE_ACTION_OUTCOME_HIGH_STAKES_MESSAGES,
  DURABLE_ACTION_OUTCOME_TRIVIAL_TOAST_SOURCE_ROOTS,
  type DurableActionOutcomeGuardedSurface,
} from "@/lib/durable-action-outcome-inventory";
import { readSurfaceSourceBundle } from "@/lib/report-problem-surfaces-guard";

export type DurableActionOutcomeGuardViolation = {
  readonly surfaceId: string;
  readonly message: string;
};

const TOAST_CALL_PATTERN = /\bshow(?:Success|Error)\s*\(/;

type ToastMock = {
  mock: {
    calls: ReadonlyArray<ReadonlyArray<unknown>>;
  };
};

function collectOperatorSourceFiles(absoluteRoot: string): string[] {
  if (!existsSync(absoluteRoot)) {
    return [];
  }

  const stat = statSync(absoluteRoot);

  if (stat.isFile()) {
    return absoluteRoot.endsWith(".ts") || absoluteRoot.endsWith(".tsx") ? [absoluteRoot] : [];
  }

  const files: string[] = [];

  for (const entry of readdirSync(absoluteRoot, { withFileTypes: true })) {
    const childPath = join(absoluteRoot, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectOperatorSourceFiles(childPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
      files.push(childPath);
    }
  }

  return files;
}

function relativeSrcPath(uiRoot: string, absolutePath: string): string {
  const normalizedRoot = join(uiRoot, "src").replace(/\\/g, "/");
  const normalizedPath = absolutePath.replace(/\\/g, "/");

  return normalizedPath.startsWith(`${normalizedRoot}/`)
    ? normalizedPath.slice(normalizedRoot.length + 1)
    : normalizedPath;
}

function isTrivialToastSource(relativePath: string): boolean {
  if (relativePath.endsWith(".test.ts") || relativePath.endsWith(".test.tsx")) {
    return true;
  }

  if (relativePath.includes("/__tests__/")) {
    return true;
  }

  return DURABLE_ACTION_OUTCOME_TRIVIAL_TOAST_SOURCE_ROOTS.some((root) => relativePath === root);
}

function lineMatchesAllowedToastPattern(
  line: string,
  surface: DurableActionOutcomeGuardedSurface,
): boolean {
  const patterns = [
    ...DURABLE_ACTION_OUTCOME_GLOBAL_ALLOWED_TOAST_LINE_PATTERNS,
    ...(surface.allowedToastLinePatterns ?? []),
  ];

  return patterns.some((pattern) => pattern.test(line));
}

function findForbiddenToastLines(
  source: string,
  surface: DurableActionOutcomeGuardedSurface,
): string[] {
  const forbiddenLines: string[] = [];
  const lines = source.split(/\r?\n/);

  for (const line of lines) {
    if (!TOAST_CALL_PATTERN.test(line)) {
      continue;
    }

    if (lineMatchesAllowedToastPattern(line, surface)) {
      continue;
    }

    forbiddenLines.push(line.trim());
  }

  return forbiddenLines;
}

export function findDurableActionOutcomeSurfaceViolations(uiRoot: string): DurableActionOutcomeGuardViolation[] {
  const violations: DurableActionOutcomeGuardViolation[] = [];

  for (const surface of DURABLE_ACTION_OUTCOME_GUARDED_SURFACES) {
    const combinedSource = surface.sourceRoots.map((root) => readSurfaceSourceBundle(uiRoot, root)).join("\n");

    if (combinedSource.length === 0) {
      violations.push({
        surfaceId: surface.id,
        message: `Guarded source roots missing on disk: ${surface.sourceRoots.join(", ")}`,
      });
      continue;
    }

    for (const marker of surface.requiredDurableMarkers) {
      if (!combinedSource.includes(marker)) {
        violations.push({
          surfaceId: surface.id,
          message: `Expected durable marker "${marker}" in guarded sources.`,
        });
      }
    }

    for (const forbiddenLine of findForbiddenToastLines(combinedSource, surface)) {
      violations.push({
        surfaceId: surface.id,
        message: `Forbidden toast call on save/mutation path: ${forbiddenLine}`,
      });
    }
  }

  return violations;
}

export function findHighStakesToastOnlyCopyViolations(uiRoot: string): DurableActionOutcomeGuardViolation[] {
  const violations: DurableActionOutcomeGuardViolation[] = [];
  const srcRoot = join(uiRoot, "src");

  for (const absolutePath of collectOperatorSourceFiles(srcRoot)) {
    const relativePath = relativeSrcPath(uiRoot, absolutePath);

    if (isTrivialToastSource(relativePath)) {
      continue;
    }

    if (relativePath.endsWith("-copy.ts")) {
      continue;
    }

    const source = readFileSync(absolutePath, "utf8");
    const lines = source.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]!;

      if (!TOAST_CALL_PATTERN.test(line)) {
        continue;
      }

      if (DURABLE_ACTION_OUTCOME_GLOBAL_ALLOWED_TOAST_LINE_PATTERNS.some((pattern) => pattern.test(line))) {
        continue;
      }

      for (const exportName of DURABLE_ACTION_OUTCOME_HIGH_STAKES_COPY_EXPORTS) {
        if (line.includes(exportName)) {
          violations.push({
            surfaceId: "high-stakes-copy",
            message: `${relativePath}:${index + 1} uses toast for high-stakes copy export "${exportName}".`,
          });
        }
      }

      for (const message of DURABLE_ACTION_OUTCOME_HIGH_STAKES_MESSAGES) {
        if (message.length < 12) {
          continue;
        }

        if (line.includes(`"${message}"`) || line.includes(`'${message}'`)) {
          violations.push({
            surfaceId: "high-stakes-copy",
            message: `${relativePath}:${index + 1} uses toast for high-stakes message "${message}".`,
          });
        }
      }
    }
  }

  return violations;
}

export function findDurableActionOutcomeGuardViolations(uiRoot: string): DurableActionOutcomeGuardViolation[] {
  return [
    ...findDurableActionOutcomeSurfaceViolations(uiRoot),
    ...findHighStakesToastOnlyCopyViolations(uiRoot),
  ];
}

function stringifyToastArgument(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

/** Lists unexpected high-stakes save-path toast calls for component test assertions (TB-2116). */
export function listUnexpectedHighStakesSavePathToasts(
  showSuccess: ToastMock,
  showError: ToastMock,
  options?: {
    readonly allowedSuccessSubstrings?: readonly string[];
    readonly allowedErrorSubstrings?: readonly string[];
  },
): string[] {
  const unexpected: string[] = [];

  for (const call of showSuccess.mock.calls) {
    const message = stringifyToastArgument(call[0]);

    if (options?.allowedSuccessSubstrings?.some((substring) => message.includes(substring)) === true) {
      continue;
    }

    if (DURABLE_ACTION_OUTCOME_HIGH_STAKES_MESSAGES.some((phrase) => message.includes(phrase))) {
      unexpected.push(`showSuccess(${message})`);
    }
  }

  for (const call of showError.mock.calls) {
    const message = stringifyToastArgument(call[0]);

    if (options?.allowedErrorSubstrings?.some((substring) => message.includes(substring)) === true) {
      continue;
    }

    if (message.length > 0) {
      unexpected.push(`showError(${message})`);
    }
  }

  return unexpected;
}

/** TB-2116 — assert high-stakes mutation paths did not use toast-only acceptance/errors. */
export function expectNoHighStakesOutcomeToast(
  showSuccess: Mock | ToastMock,
  showError: Mock | ToastMock,
  options?: {
    readonly allowedSuccessSubstrings?: readonly string[];
    readonly allowedErrorSubstrings?: readonly string[];
  },
): void {
  expect(listUnexpectedHighStakesSavePathToasts(showSuccess, showError, options)).toEqual([]);
}

/** Alias for component tests that only care about save-path toast inventory. */
export function expectNoHighStakesSavePathToasts(
  showSuccess: Mock | ToastMock,
  showError: Mock | ToastMock,
  options?: {
    readonly allowedSuccessSubstrings?: readonly string[];
    readonly allowedErrorSubstrings?: readonly string[];
  },
): void {
  expect(listUnexpectedHighStakesSavePathToasts(showSuccess, showError, options)).toEqual([]);
}

/** Alias for component tests that only care about save-path toast inventory. */
export function expectNoDurableOutcomeToasts(showSuccess: Mock | ToastMock, showError: Mock | ToastMock): void {
  expectNoHighStakesOutcomeToast(showSuccess, showError);
}
