import { describe, expect, it } from "vitest";

import {
  isTransparencyTrailComplete,
  transparencyTrailIncompleteFinalizeReason,
  TRANSPARENCY_TRAIL_INCOMPLETE_FINALIZE_REASON,
} from "@/lib/feasibility/transparency-trail-completeness";
import type { TransparencyTrail } from "@/types/feasibility-verdict";

describe("transparency-trail-completeness", () => {
  it("accepts empty section arrays", () => {
    const trail: TransparencyTrail = {
      asserted: [],
      inferred: [],
      skipped: [],
    };

    expect(isTransparencyTrailComplete(trail)).toBe(true);
    expect(transparencyTrailIncompleteFinalizeReason(trail)).toBeNull();
  });

  it("rejects null trail", () => {
    expect(isTransparencyTrailComplete(null)).toBe(false);
    expect(transparencyTrailIncompleteFinalizeReason(null)).toBe(
      TRANSPARENCY_TRAIL_INCOMPLETE_FINALIZE_REASON,
    );
  });

  it("rejects trail with non-array sections", () => {
    const trail = {
      asserted: [],
      inferred: null,
      skipped: [],
    } as unknown as TransparencyTrail;

    expect(isTransparencyTrailComplete(trail)).toBe(false);
    expect(transparencyTrailIncompleteFinalizeReason(trail)).toContain("inferred");
  });
});
