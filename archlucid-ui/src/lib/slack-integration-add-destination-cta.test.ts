import { describe, expect, it } from "vitest";

import { resolveSlackAddDestinationCtaPresentation } from "@/lib/slack-integration-add-destination-cta";

describe("resolveSlackAddDestinationCtaPresentation (TB-1190)", () => {
  it("promotes Test and demotes Save until a successful form test", () => {
    const result = resolveSlackAddDestinationCtaPresentation({
      formTestSucceeded: false,
      canMutate: true,
      loading: false,
      testingForm: false,
    });

    expect(result.testVariant).toBe("primary");
    expect(result.saveVariant).toBe("outline");
    expect(result.saveDisabled).toBe(true);
    expect(result.showSaveDisabledHelper).toBe(true);
  });

  it("enables Save as primary after a successful form test", () => {
    const result = resolveSlackAddDestinationCtaPresentation({
      formTestSucceeded: true,
      canMutate: true,
      loading: false,
      testingForm: false,
    });

    expect(result.testVariant).toBe("outline");
    expect(result.saveVariant).toBe("primary");
    expect(result.saveDisabled).toBe(false);
    expect(result.showSaveDisabledHelper).toBe(false);
  });

  it("keeps Save disabled while loading even after a successful test", () => {
    const result = resolveSlackAddDestinationCtaPresentation({
      formTestSucceeded: true,
      canMutate: true,
      loading: true,
      testingForm: false,
    });

    expect(result.saveDisabled).toBe(true);
    expect(result.showSaveDisabledHelper).toBe(false);
  });
});
