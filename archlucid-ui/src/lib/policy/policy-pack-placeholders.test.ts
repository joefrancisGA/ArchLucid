import { describe, expect, it } from "vitest";

import {
  findPolicyPackPlaceholders,
  policyPackPlaceholderValidationMessage,
} from "./policy-pack-placeholders";

describe("policy pack placeholders", () => {
  it("returns unique placeholders in document order", () => {
    expect(findPolicyPackPlaceholders("{{organization.allowedRegions}} and {{organization.allowedRegions}}; {{organization.requiredTags}}"))
      .toEqual(["organization.allowedRegions", "organization.requiredTags"]);
  });

  it("returns an inline validation message", () => {
    expect(policyPackPlaceholderValidationMessage(["organization.allowedRegions"]))
      .toBe("Fill in required policy values: {{organization.allowedRegions}}.");
  });
});
