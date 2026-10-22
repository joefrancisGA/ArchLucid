import { describe, expect, it } from "vitest";

import { findSurfaceMarkerViolations } from "@/lib/error-recovery-contract-guard";
import { REVIEW_PIPELINE_IN_FLIGHT_SURFACES } from "@/lib/operations/review-pipeline-in-flight-inventory";

const UI_ROOT = process.cwd();

describe("review-pipeline-in-flight-guard", () => {
  it("keeps shell in-flight registration on every path that starts a review", () => {
    const violations = findSurfaceMarkerViolations(UI_ROOT, REVIEW_PIPELINE_IN_FLIGHT_SURFACES);

    expect(violations.map((violation) => `${violation.surfaceId}: ${violation.message}`)).toEqual([]);
  });

  it("covers the primary create paths, not just async re-execute", () => {
    const ids = REVIEW_PIPELINE_IN_FLIGHT_SURFACES.map((surface) => surface.id);

    expect(ids).toContain("wizard-form-create-run");
    expect(ids).toContain("first-pilot-intake-wizard");
    expect(ids).toContain("guided-intake-draft-submit");
    expect(ids).toContain("architecture-run-async-execute");
  });
});
