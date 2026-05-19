import { describe, expect, it } from "vitest";

import { POLICY_PACK_ID_QUERY_PARAM, policyPacksEditHref } from "@/lib/policy-packs-deep-link";

describe("policy-packs-deep-link", () => {
  it("builds href with packId query param", () => {
    const href = policyPacksEditHref("11111111-1111-1111-1111-111111111111");

    expect(href).toContain("/policy-packs?");
    expect(href).toContain(`${POLICY_PACK_ID_QUERY_PARAM}=11111111-1111-1111-1111-111111111111`);
  });

  it("returns bare route when pack id is empty", () => {
    expect(policyPacksEditHref("   ")).toBe("/policy-packs");
  });
});
