import { describe, expect, it } from "vitest";

import {
  POLICY_PACK_TYPE_PLATFORM_DEFAULT,
  isBundledPlatformDefaultPackType,
  policyPackTypeDisplayLabel,
} from "@/lib/policy/policy-pack-type-label";

describe("policyPackTypeDisplayLabel", () => {
  it("maps PlatformDefault to bundled label", () => {
    expect(policyPackTypeDisplayLabel(POLICY_PACK_TYPE_PLATFORM_DEFAULT)).toBe("Bundled default (platform)");
  });

  it("falls back to raw unknown types", () => {
    expect(policyPackTypeDisplayLabel("ExperimentalCustom")).toBe("ExperimentalCustom");
  });

  it("labels empty pack type as not returned", () => {
    expect(policyPackTypeDisplayLabel("")).toBe("Pack type not returned");
    expect(policyPackTypeDisplayLabel("   ")).toBe("Pack type not returned");
  });
});

describe("isBundledPlatformDefaultPackType", () => {
  it("detects seeded platform bundles", () => {
    expect(isBundledPlatformDefaultPackType(POLICY_PACK_TYPE_PLATFORM_DEFAULT)).toBe(true);
    expect(isBundledPlatformDefaultPackType(undefined)).toBe(false);
    expect(isBundledPlatformDefaultPackType("ProjectCustom")).toBe(false);
  });
});
