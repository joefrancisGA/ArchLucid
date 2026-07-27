import { describe, expect, it } from "vitest";

import { resolveGovernanceSetupStepCtaVariant } from "./resolve-governance-setup-step-cta-variant";

describe("resolveGovernanceSetupStepCtaVariant (TB-1137)", () => {
  it("returns primary only for the recommended-next step", () => {
    expect(
      resolveGovernanceSetupStepCtaVariant({ recommendedNext: true, status: "not-started" }),
    ).toBe("primary");
    expect(
      resolveGovernanceSetupStepCtaVariant({ recommendedNext: true, status: "in-progress" }),
    ).toBe("primary");
  });

  it("returns outline for non-recommended steps regardless of status", () => {
    expect(
      resolveGovernanceSetupStepCtaVariant({ recommendedNext: false, status: "not-started" }),
    ).toBe("outline");
    expect(
      resolveGovernanceSetupStepCtaVariant({ recommendedNext: false, status: "in-progress" }),
    ).toBe("outline");
    expect(
      resolveGovernanceSetupStepCtaVariant({ recommendedNext: false, status: "complete" }),
    ).toBe("outline");
  });
});
