import { describe, expect, it } from "vitest";

import { resolveTeamsConnectCtaPresentation } from "@/lib/teams-integration-connect-cta";

describe("resolveTeamsConnectCtaPresentation (TB-1176)", () => {
  it("promotes Validate and demotes Save when not configured", () => {
    const result = resolveTeamsConnectCtaPresentation({
      isConfigured: false,
      secretValidated: false,
      testSucceeded: false,
      canMutate: true,
      saving: false,
      secretNameEmpty: false,
      canSendTest: false,
    });

    expect(result.validateVariant).toBe("primary");
    expect(result.saveVariant).toBe("outline");
    expect(result.saveDisabled).toBe(true);
    expect(result.showTestDisabledHelper).toBe(true);
    expect(result.showSaveDisabledHelper).toBe(true);
  });

  it("promotes Test after validation when not configured", () => {
    const result = resolveTeamsConnectCtaPresentation({
      isConfigured: false,
      secretValidated: true,
      testSucceeded: false,
      canMutate: true,
      saving: false,
      secretNameEmpty: false,
      canSendTest: true,
    });

    expect(result.validateVariant).toBe("outline");
    expect(result.testVariant).toBe("primary");
    expect(result.saveVariant).toBe("outline");
    expect(result.saveDisabled).toBe(false);
    expect(result.showTestDisabledHelper).toBe(false);
    expect(result.showSaveDisabledHelper).toBe(false);
  });

  it("promotes Save after a successful test when not configured", () => {
    const result = resolveTeamsConnectCtaPresentation({
      isConfigured: false,
      secretValidated: true,
      testSucceeded: true,
      canMutate: true,
      saving: false,
      secretNameEmpty: false,
      canSendTest: true,
    });

    expect(result.saveVariant).toBe("primary");
    expect(result.validateVariant).toBe("outline");
    expect(result.testVariant).toBe("outline");
    expect(result.saveDisabled).toBe(false);
  });

  it("enables Save after validation when not configured", () => {
    const result = resolveTeamsConnectCtaPresentation({
      isConfigured: false,
      secretValidated: true,
      testSucceeded: false,
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
      testSucceeded: true,
      canMutate: true,
      saving: false,
      secretNameEmpty: false,
      canSendTest: true,
    });

    expect(result.saveVariant).toBe("primary");
    expect(result.validateVariant).toBe("outline");
  });
});
