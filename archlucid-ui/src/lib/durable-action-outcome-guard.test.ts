import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  DURABLE_ACTION_OUTCOME_DUAL_TOAST_TEST_PATHS,
  DURABLE_ACTION_OUTCOME_GUARDED_SURFACES,
  DURABLE_ACTION_OUTCOME_HIGH_STAKES_COPY_EXPORTS,
  DURABLE_ACTION_OUTCOME_TRIVIAL_TOAST_SOURCE_ROOTS,
} from "@/lib/durable-action-outcome-inventory";
import {
  expectNoDurableOutcomeToasts,
  findDurableActionOutcomeGuardViolations,
  listUnexpectedHighStakesSavePathToasts,
} from "@/lib/durable-action-outcome-guard";

const UI_ROOT = process.cwd();
const SRC_ROOT = join(UI_ROOT, "src");

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

describe("durable-action-outcome-guard (TB-2116)", () => {
  it("documents TB-2113–TB-2115 guarded surfaces and trivial toast allowlist", () => {
    const surfaceIds = DURABLE_ACTION_OUTCOME_GUARDED_SURFACES.map((surface) => surface.id);

    expect(surfaceIds).toContain("review-generation-created-notice");
    expect(surfaceIds).toContain("review-start-first-pilot");
    expect(surfaceIds).toContain("governance-quick-approve");
    expect(surfaceIds).toContain("admin-cloud-connection-save");
    expect(surfaceIds).toContain("admin-billing-checkout");
    expect(DURABLE_ACTION_OUTCOME_GUARDED_SURFACES.length).toBeGreaterThanOrEqual(16);
    expect(DURABLE_ACTION_OUTCOME_TRIVIAL_TOAST_SOURCE_ROOTS).toContain(
      "lib/webhook-subscription-connection-test.ts",
    );
    expect(DURABLE_ACTION_OUTCOME_HIGH_STAKES_COPY_EXPORTS.length).toBeGreaterThanOrEqual(20);
  });

  it("keeps guarded durable-outcome surfaces free of toast-only high-stakes acceptance", () => {
    const violations = findDurableActionOutcomeGuardViolations(UI_ROOT);

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });

  it("documents dual-toast Vitest inventory files and asserts they guard showSuccess", () => {
    const missingTests: string[] = [];
    const missingAssertion: string[] = [];

    for (const relativePath of DURABLE_ACTION_OUTCOME_DUAL_TOAST_TEST_PATHS) {
      const absolutePath = join(SRC_ROOT, relativePath);

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

  it("exposes shared no-toast helper for component tests", () => {
    const showSuccess = vi.fn();
    const showError = vi.fn();

    expectNoDurableOutcomeToasts(showSuccess, showError);

    expect(showSuccess).not.toHaveBeenCalled();
    expect(showError).not.toHaveBeenCalled();
  });

  it("allows clipboard echo toasts in save-path component tests when configured", () => {
    const showSuccess = { mock: { calls: [["Setup script copied."]] as const } };
    const showError = { mock: { calls: [] as const } };

    expect(
      listUnexpectedHighStakesSavePathToasts(showSuccess, showError, {
        allowedSuccessSubstrings: ["Setup script copied."],
      }),
    ).toEqual([]);
  });
});
