import { describe, expect, it } from "vitest";

import { CLOUD_TARGET_QUESTION_KEY } from "@/lib/architecture/architecture-creation-question-definition";

import {
  deriveGuidedIntakePolicyPackCloudMismatch,
  deriveGuidedIntakePolicyReferences,
} from "./guided-intake-policy-pack-cloud-mismatch";

describe("guided-intake-policy-pack-cloud-mismatch (TB-2322)", () => {
  it("merges deeplink policy pack with focused pilot references", () => {
    const refs = deriveGuidedIntakePolicyReferences(false, "cis-azure");

    expect(refs).toEqual(["cis-azure"]);
  });

  it("flags cloud target not stored when intake omits cloud target but pack is cloud-specific (P-17, P-18)", () => {
    const mismatch = deriveGuidedIntakePolicyPackCloudMismatch(false, "cis-azure", {});

    expect(mismatch).toBe("Cloud target was not stored.");
  });

  it("flags Azure deeplink pack when cloud target is AWS", () => {
    const mismatch = deriveGuidedIntakePolicyPackCloudMismatch(false, "cis-azure", {
      [CLOUD_TARGET_QUESTION_KEY]: "Aws",
    });

    expect(mismatch).toContain("AWS");
    expect(mismatch).toContain("Azure");
  });
});
