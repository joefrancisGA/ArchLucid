import { CLAIMS_INTAKE_RULE_SET_VERSION } from "@/lib/samples/claims-intake/definition";
import { CUSTOMER_INTAKE_RULE_SET_VERSION } from "@/lib/samples/customer-intake-modernization/definition";

import { describe, expect, it } from "vitest";

import { policyPackBuyerGovernanceDetailHref, policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";

describe("policyPackBuyerLabel", () => {
  it("formats healthcare claims demo pack with version", () => {
    expect(policyPackBuyerLabel("healthcare-claims-v3", CLAIMS_INTAKE_RULE_SET_VERSION)).toBe(
      "Healthcare Claims Policy Pack v3.4.1",
    );
  });

  it("formats enterprise privacy demo pack with version", () => {
    expect(policyPackBuyerLabel("enterprise-privacy-v2", CUSTOMER_INTAKE_RULE_SET_VERSION)).toBe(
      "Enterprise Privacy Policy Pack v2.1.0",
    );
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

  it("resolves enterprise privacy pack to governance narrative route", () => {
    expect(policyPackBuyerGovernanceDetailHref("enterprise-privacy-v2")).toBe(
      "/governance/policy-packs/demo-enterprise-privacy-pack",
    );
  });

  it("resolves responsible AI sample id to governance detail route", () => {
    expect(policyPackBuyerGovernanceDetailHref("1")).toBe("/governance/policy-packs/1");
  });

  it("returns null for unknown packs", () => {
    expect(policyPackBuyerGovernanceDetailHref("other-pack")).toBeNull();
  });
});
