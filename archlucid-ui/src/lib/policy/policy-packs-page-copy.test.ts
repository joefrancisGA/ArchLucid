import { describe, expect, it } from "vitest";

import {
  BUYER_POLICY_PACKS_PAGE_SUBTITLE,
  POLICY_PACKS_PAGE_SUBTITLE,
  POLICY_PACKS_PAGE_SUBTITLE_OPERATOR,
  policyPacksPageSubtitle,
} from "@/lib/policy/policy-packs-page";

describe("policy-packs-page copy", () => {
  it("uses shorter buyer policy packs subtitle", () => {
    expect(policyPacksPageSubtitle(true)).toBe(BUYER_POLICY_PACKS_PAGE_SUBTITLE);
    expect(policyPacksPageSubtitle(false)).toBe(POLICY_PACKS_PAGE_SUBTITLE_OPERATOR);
    expect(BUYER_POLICY_PACKS_PAGE_SUBTITLE.length).toBeLessThan(POLICY_PACKS_PAGE_SUBTITLE.length);
  });
});
