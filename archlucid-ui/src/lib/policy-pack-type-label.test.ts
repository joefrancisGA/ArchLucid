import { describe, expect, it } from "vitest";

import {
  POLICY_PACK_TYPE_PLATFORM_DEFAULT,
  isBundledPlatformDefaultPackType,
  policyPackTypeDisplayLabel,
} from "@/lib/policy-pack-type-label";

describe("policyPackTypeDisplayLabel", () => {
  it("maps PlatformDefault to bundled label", () => {
    expect(policyPackTypeDisplayLabel(POLICY_PACK_TYPE_PLATFORM_DEFAULT)).toBe("Bundled default (platform)");
  });

  it("falls back to raw unknown types", () => {
    expect(policyPackTypeDisplayLabel("ExperimentalCustom")).toBe("ExperimentalCustom");
  });
});

describe("isBundledPlatformDefaultPackType", () => {
  it("detects seeded platform bundles", () => {
    expect(isBundledPlatformDefaultPackType(POLICY_PACK_TYPE_PLATFORM_DEFAULT)).toBe(true);
    expect(isBundledPlatformDefaultPackType(undefined)).toBe(false);
    expect(isBundledPlatformDefaultPackType("ProjectCustom")).toBe(false);
  });
});
