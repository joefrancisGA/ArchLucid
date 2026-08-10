import { describe, expect, it } from "vitest";

import {
  ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES,
  ERROR_RECOVERY_CONTRACT_REQUIRED_MARKERS,
} from "@/lib/error-recovery-contract-inventory";
import { findErrorRecoveryContractSurfaceViolations } from "@/lib/error-recovery-contract-guard";

const UI_ROOT = process.cwd();

describe("error-recovery-contract-guard (TB-2155)", () => {
  it("documents golden-path guarded error surfaces", () => {
    const surfaceIds = ERROR_RECOVERY_CONTRACT_GUARDED_SURFACES.map((surface) => surface.id);

    expect(surfaceIds).toContain("review-package-load-failure");
    expect(surfaceIds).toContain("operator-api-problem");
    expect(surfaceIds).toContain("operator-connectivity-error");
    expect(surfaceIds).toContain("governance-mutation-inline-error");
    expect(ERROR_RECOVERY_CONTRACT_REQUIRED_MARKERS).toContain("operator-error-recovery-what-failed");
  });

  it("keeps guarded error roots wired to the recovery contract", () => {
    expect(findErrorRecoveryContractSurfaceViolations(UI_ROOT)).toEqual([]);
  });
});
