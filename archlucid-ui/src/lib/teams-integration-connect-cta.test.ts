import { describe, expect, it } from "vitest";

import { resolveTeamsConnectCtaPresentation } from "@/lib/teams-integration-connect-cta";

describe("resolveTeamsConnectCtaPresentation (TB-1176)", () => {
  it("promotes Validate and demotes Save when not configured", () => {
    const result = resolveTeamsConnectCtaPresentation({
      isConfigured: false,
      secretValidated: false,
      canMutate: true,
      saving: false,
      secretNameEmpty: false,
      canSendTest: false,
    });

    expect(result.validateVariant).toBe("primary");
    expect(result.saveVariant).toBe("outline");
    expect(result.saveDisabled).toBe(true);
    expect(result.showTestDisabledHelper).toBe(true);
  });

  it("enables Save after validation when not configured", () => {
    const result = resolveTeamsConnectCtaPresentation({
      isConfigured: false,
      secretValidated: true,
      canMutate: true,
      saving: false,
      secretNameEmpty: false,
      canSendTest: true,
    });

    expect(result.saveDisabled).toBe(false);
    expect(result.showTestDisabledHelper).toBe(false);
  });

  it("keeps Save primary when configured", () => {
    const result = resolveTeamsConnectCtaPresentation({
      isConfigured: true,
      secretValidated: true,
      canMutate: true,
      saving: false,
      secretNameEmpty: false,
      canSendTest: true,
    });

    expect(result.saveVariant).toBe("primary");
    expect(result.validateVariant).toBe("outline");
  });
});
