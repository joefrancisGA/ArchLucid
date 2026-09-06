import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { DURABLE_ACTION_OUTCOME_GUARDED_SURFACES } from "@/lib/durable-action-outcome-inventory";
import { findDurableActionOutcomeSurfaceViolations } from "@/lib/durable-action-outcome-guard";
import {
  DURABLE_MUTATION_DUAL_TOAST_TEST_PATHS,
  DURABLE_MUTATION_FORBIDDEN_TOAST_SUCCESS_PHRASES,
  DURABLE_MUTATION_TEMPORARY_TOAST_DEBT_PATHS,
  DURABLE_MUTATION_TRIVIAL_TOAST_ALLOWLIST,
} from "@/lib/durable-mutation-outcome-inventory";
import { readSurfaceSourceBundle } from "@/lib/report-problem-surfaces-guard";

const SRC_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const UI_ROOT = path.dirname(SRC_ROOT);

function listSourceFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...listSourceFiles(fullPath));

      continue;
    }

    if (!/\.(ts|tsx)$/.test(entry)) {
      continue;
    }

    if (/\.(test|spec)\.(ts|tsx)$/.test(entry)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function relativeSrcPath(filePath: string): string {
  return path.relative(SRC_ROOT, filePath).replace(/\\/g, "/");
}

function isTrivialToastAllowed(relativePath: string, showSuccessCall: string): boolean {
  return DURABLE_MUTATION_TRIVIAL_TOAST_ALLOWLIST.some(
    (entry) => relativePath.endsWith(entry.pathSuffix) && showSuccessCall.includes(entry.allowedPhrase),
  );
}

function findToastOnlyHighStakesOffenders(): string[] {
  const offenders: string[] = [];

  for (const filePath of listSourceFiles(SRC_ROOT)) {
    const relativePath = relativeSrcPath(filePath);

    if (DURABLE_MUTATION_TEMPORARY_TOAST_DEBT_PATHS.includes(relativePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");

    if (!content.includes("showSuccess")) {
      continue;
    }

    const showSuccessCalls = content.match(/showSuccess\([^)]*\)/gs) ?? [];

    for (const call of showSuccessCalls) {
      if (isTrivialToastAllowed(relativePath, call)) {
        continue;
      }

      for (const phrase of DURABLE_MUTATION_FORBIDDEN_TOAST_SUCCESS_PHRASES) {
        if (call.includes(phrase)) {
          offenders.push(`${relativePath}: ${call.replace(/\s+/g, " ").trim()}`);
        }
      }
    }
  }

  return offenders;
}

function hasDualToastRegressionGuard(testSource: string): boolean {
  if (testSource.includes("showSuccess).not.toHaveBeenCalled")) {
    return true;
  }

  if (testSource.includes("showError).not.toHaveBeenCalled")) {
    return true;
  }

  if (testSource.includes("mocked(showError)")) {
    return true;
  }

  if (testSource.includes("expectNoHighStakesSavePathToasts")) {
    return true;
  }

  if (testSource.includes("findToastOnlyHighStakesOffenders")) {
    return true;
  }

  if (testSource.includes("success-callout")) {
    return true;
  }

  if (testSource.includes("-validation-error")) {
    return true;
  }

  if (testSource.includes("review-generation-created-notice")) {
    return true;
  }

  return false;
}

describe("TB-2116 durable mutation outcome guard", () => {
  it("does not toast high-stakes acceptance copy on operator mutation surfaces", () => {
    expect(findToastOnlyHighStakesOffenders()).toEqual([]);
  });

  it("keeps guarded surfaces wired to durable in-page outcome components", () => {
    const violations = findDurableActionOutcomeSurfaceViolations(UI_ROOT);

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  it("documents guarded source roots on disk", () => {
    const missingRoots: string[] = [];

    for (const surface of DURABLE_ACTION_OUTCOME_GUARDED_SURFACES) {
      for (const sourceRoot of surface.sourceRoots) {
        const absolutePath = path.join(SRC_ROOT, ...sourceRoot.split("/"));

        if (!existsSync(absolutePath)) {
          missingRoots.push(`${surface.id}: ${sourceRoot}`);
        }
      }
    }

    expect(missingRoots).toEqual([]);
  });

  it("keeps guarded source bundles aligned with required durable markers", () => {
    const missingMarkers: string[] = [];

    for (const surface of DURABLE_ACTION_OUTCOME_GUARDED_SURFACES) {
      const combinedSource = surface.sourceRoots
        .map((root) => readSurfaceSourceBundle(UI_ROOT, root))
        .join("\n");

      for (const marker of surface.requiredDurableMarkers) {
        if (!combinedSource.includes(marker)) {
          missingMarkers.push(`${surface.id}: ${marker}`);
        }
      }
    }

    expect(missingMarkers).toEqual([]);
  });

  it("documents dual-toast Vitest inventory files and asserts they guard showSuccess", () => {
    const missingTests: string[] = [];
    const missingAssertion: string[] = [];

    for (const relativePath of DURABLE_MUTATION_DUAL_TOAST_TEST_PATHS) {
      const absolutePath = path.join(SRC_ROOT, ...relativePath.split("/"));

      if (!existsSync(absolutePath)) {
        missingTests.push(relativePath);

        continue;
      }

      const content = readFileSync(absolutePath, "utf8");

      if (!hasDualToastRegressionGuard(content)) {
        missingAssertion.push(relativePath);
      }
    }

    expect(missingTests).toEqual([]);
    expect(missingAssertion).toEqual([]);
  });
});
