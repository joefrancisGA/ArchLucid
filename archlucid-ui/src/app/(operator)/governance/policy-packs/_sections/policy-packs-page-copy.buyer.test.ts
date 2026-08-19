import { describe, expect, it } from "vitest";

import { policyPacksPageSubtitle } from "@/lib/policy/policy-packs-page";

import { POLICY_PACKS_CLAIM_HEADING } from "./policy-packs-page-copy";

describe("policy-packs-page-copy buyer page chrome", () => {
  it("uses buyer subtitle only in polished shell", () => {
    expect(policyPacksPageSubtitle(true)).toContain("active pack");
    expect(policyPacksPageSubtitle(false)).toContain("bundle rules");
  });

  it("keeps claim heading library-first", () => {
    expect(POLICY_PACKS_CLAIM_HEADING.toLowerCase()).toContain("library");
  });
});
