import { describe, expect, it } from "vitest";

import {
  BUYER_POLICY_PACKS_PAGE_SUBTITLE,
  POLICY_PACKS_PAGE_SUBTITLE,
  POLICY_PACKS_PAGE_SUBTITLE_OPERATOR,
  SECURENOW_BUYER_POLICY_PACKS_PAGE_SUBTITLE,
  policyPacksPageSubtitle,
} from "@/lib/policy/policy-packs-page";

describe("policy-packs-page copy", () => {
  it("uses shorter buyer policy packs subtitle", () => {
    expect(policyPacksPageSubtitle(true)).toBe(BUYER_POLICY_PACKS_PAGE_SUBTITLE);
    expect(policyPacksPageSubtitle(false)).toBe(POLICY_PACKS_PAGE_SUBTITLE_OPERATOR);
    expect(BUYER_POLICY_PACKS_PAGE_SUBTITLE.length).toBeLessThan(POLICY_PACKS_PAGE_SUBTITLE.length);
  });

  it("uses SecureNow buyer subtitle without architecture review language", () => {
    expect(policyPacksPageSubtitle(true, "security")).toBe(SECURENOW_BUYER_POLICY_PACKS_PAGE_SUBTITLE);
    expect(SECURENOW_BUYER_POLICY_PACKS_PAGE_SUBTITLE).toContain("cloud evidence scans");
    expect(SECURENOW_BUYER_POLICY_PACKS_PAGE_SUBTITLE).not.toContain("reviews");
  });
});
