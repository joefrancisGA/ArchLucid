import { describe, expect, it } from "vitest";

import { deriveAiOutputGovernanceLabel } from "@/lib/ai-output-governance-label";

describe("deriveAiOutputGovernanceLabel", () => {
  it("returns governed when a FindingId is present", () => {
    const model = deriveAiOutputGovernanceLabel({ findingId: "finding-abc" });

    expect(model.kind).toBe("governed");
    expect(model.label).toBe("Governed finding");
  });

  it("returns advisory when FindingId is absent", () => {
    const model = deriveAiOutputGovernanceLabel({ findingId: null });

    expect(model.kind).toBe("advisory");
    expect(model.label).toContain("Advisory");
  });

  it("forces advisory for holistic critic and Ask assistant surfaces", () => {
    const model = deriveAiOutputGovernanceLabel({ findingId: "ignored", forceAdvisory: true });

    expect(model.kind).toBe("advisory");
  });
});
