import { describe, expect, it } from "vitest";

import { findSurfaceMarkerViolations } from "@/lib/error-recovery-contract-guard";
import { ADVISORY_DRAFT_IN_FLIGHT_SURFACES } from "@/lib/operations/advisory-draft-in-flight-inventory";

const UI_ROOT = process.cwd();

describe("advisory-draft-in-flight-guard", () => {
  it("keeps shell in-flight registration on Suggest from overview accept", () => {
    const violations = findSurfaceMarkerViolations(UI_ROOT, ADVISORY_DRAFT_IN_FLIGHT_SURFACES);

    expect(violations.map((violation) => `${violation.surfaceId}: ${violation.message}`)).toEqual([]);
  });

  it("covers the async structured-brief suggest accept path", () => {
    const ids = ADVISORY_DRAFT_IN_FLIGHT_SURFACES.map((surface) => surface.id);

    expect(ids).toContain("structured-brief-suggest-async-accept");
  });
});
