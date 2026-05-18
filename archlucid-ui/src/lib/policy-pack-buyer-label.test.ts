import { describe, expect, it } from "vitest";

import { policyPackBuyerGovernanceDetailHref, policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";

describe("policyPackBuyerLabel", () => {
  it("formats healthcare claims demo pack with version", () => {
    expect(policyPackBuyerLabel("healthcare-claims-v3", "3.4.1")).toBe("Healthcare Claims Policy Pack v3.4.1");
  });

  it("formats generic id and version", () => {
    expect(policyPackBuyerLabel("custom-rules", "2")).toBe("custom-rules v2");
  });

  it("returns dash when empty", () => {
    expect(policyPackBuyerLabel("", "")).toBe("—");
  });
});

describe("policyPackBuyerGovernanceDetailHref", () => {
  it("resolves healthcare claims pack to governance narrative route", () => {
    expect(policyPackBuyerGovernanceDetailHref("healthcare-claims-v3")).toBe(
      "/governance/policy-packs/demo-healthcare-claims-pack",
    );
  });

  it("trims rule set id", () => {
    expect(policyPackBuyerGovernanceDetailHref("  healthcare-claims-v3  ")).toBe(
      "/governance/policy-packs/demo-healthcare-claims-pack",
    );
  });

  it("returns null for unknown packs", () => {
    expect(policyPackBuyerGovernanceDetailHref("other-pack")).toBeNull();
  });
});
