import { describe, expect, it } from "vitest";

import {
  PRIVACY_POLICY_PAGE_LEDE_BUYER,
  PRIVACY_POLICY_PAGE_LEDE_OPERATOR,
  privacyPolicyPageLede,
} from "@/lib/privacy-policy-page-copy";

describe("privacyPolicyPageLede", () => {
  it("selects buyer and operator ledes", () => {
    expect(privacyPolicyPageLede(true)).toBe(PRIVACY_POLICY_PAGE_LEDE_BUYER);
    expect(privacyPolicyPageLede(false)).toBe(PRIVACY_POLICY_PAGE_LEDE_OPERATOR);
    expect(PRIVACY_POLICY_PAGE_LEDE_BUYER.length).toBeLessThan(PRIVACY_POLICY_PAGE_LEDE_OPERATOR.length);
  });
});
