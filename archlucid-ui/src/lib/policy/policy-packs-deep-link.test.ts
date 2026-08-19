import { describe, expect, it } from "vitest";

import {
  POLICY_PACK_ID_QUERY_PARAM,
  POLICY_PACKS_TAB_QUERY_PARAM,
  POLICY_RULE_ID_QUERY_PARAM,
  policyPacksAuthorHref,
  policyPacksEditHref,
  policyPacksRuleHref,
  reviewsNewWithPackHref,
} from "@/lib/policy/policy-packs-deep-link";

describe("policy-packs-deep-link", () => {
  it("builds href with packId query param", () => {
    const href = policyPacksEditHref("11111111-1111-1111-1111-111111111111");

    expect(href).toContain("/governance/policy-packs?");
    expect(href).toContain(`${POLICY_PACK_ID_QUERY_PARAM}=11111111-1111-1111-1111-111111111111`);
  });

  it("returns bare route when pack id is empty", () => {
    expect(policyPacksEditHref("   ")).toBe("/governance/policy-packs");
  });

  it("builds author tab href with optional pack and rule focus", () => {
    expect(policyPacksAuthorHref("healthcare-claims-v3", "sec-base-001")).toBe(
      `/governance/policy-packs?${POLICY_PACKS_TAB_QUERY_PARAM}=author&${POLICY_PACK_ID_QUERY_PARAM}=healthcare-claims-v3&${POLICY_RULE_ID_QUERY_PARAM}=sec-base-001`,
    );
    expect(policyPacksAuthorHref()).toBe(`/governance/policy-packs?${POLICY_PACKS_TAB_QUERY_PARAM}=author`);
  });

  it("builds policy packs href with ruleId query param", () => {
    const href = policyPacksRuleHref("architecture-risk-phi-intake");

    expect(href).toBe(
      `/governance/policy-packs?${POLICY_RULE_ID_QUERY_PARAM}=architecture-risk-phi-intake`,
    );
  });

  it("builds new review href with packId query param", () => {
    expect(reviewsNewWithPackHref("pack-abc")).toBe(
      `/architecture/reviews/new?${POLICY_PACK_ID_QUERY_PARAM}=pack-abc`,
    );
    expect(reviewsNewWithPackHref("   ")).toBe("/architecture/reviews/new");
  });
});
