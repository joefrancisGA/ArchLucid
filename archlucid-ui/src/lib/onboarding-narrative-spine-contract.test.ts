import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  listOnboardingNarrativeSpineMismatches,
  ONBOARDING_NARRATIVE_SPINE_CONTRACT,
} from "@/lib/onboarding-narrative-spine-contract";

describe("ONBOARDING_NARRATIVE_SPINE_CONTRACT (TB-344)", () => {
  it("lists guarded first-run surfaces", () => {
    const ids = ONBOARDING_NARRATIVE_SPINE_CONTRACT.stepOneSurfaces.map((surface) => surface.id);

    expect(ids).toEqual([
      "core-pilot-step-1",
      "first-review-empty-state-step-1",
      "operating-rail-ingest",
    ]);
  });

  it("keeps live step-1 copy aligned with the contract", () => {
    expect(listOnboardingNarrativeSpineMismatches()).toEqual([]);
  });

  it("empty-state component step 1 uses evidence-first label", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/components/operator-home/OperatorHomeFirstReviewEmptyState.tsx"),
      "utf8",
    );

    expect(source).toContain('label: "Provide architecture evidence"');

    for (const phrase of ONBOARDING_NARRATIVE_SPINE_CONTRACT.bannedStepOneLeadPhrases) {
      expect(source.toLowerCase()).not.toContain(phrase);
    }
  });
});
