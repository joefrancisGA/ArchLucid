import { describe, expect, it } from "vitest";

import {
  listOnboardingNarrativeSpineMismatches,
  ONBOARDING_NARRATIVE_SPINE_CONTRACT,
} from "@/lib/onboarding-narrative-spine-contract";

describe("ONBOARDING_NARRATIVE_SPINE_CONTRACT (TB-344)", () => {
  it("lists guarded first-run surfaces", () => {
    const ids = ONBOARDING_NARRATIVE_SPINE_CONTRACT.stepOneSurfaces.map((surface) => surface.id);

    expect(ids).toEqual(["core-pilot-step-1", "operating-rail-ingest"]);
  });

  it("keeps live step-1 copy aligned with the contract", () => {
    expect(listOnboardingNarrativeSpineMismatches()).toEqual([]);
  });
});
