import { describe, expect, it } from "vitest";

import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";
import {
  POLICY_PACK_DETAIL_HUB_COMPACT_LINE,
  POLICY_PACK_DETAIL_HUB_HEADING,
  POLICY_PACK_DETAIL_HUB_PACKS_LINK,
  POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK,
  POLICY_PACK_DETAIL_HUB_WHY_TWO,
  buildPolicyPackDetailHubVocabulary,
  resolvePolicyPackDetailHubPeerLink,
} from "@/lib/policy-pack-detail-hub-vocabulary";

describe("policy-pack-detail-hub-vocabulary (TB-2283)", () => {
  it("explains pack detail vs policy packs hub and deep-links the hub", () => {
    const model = buildPolicyPackDetailHubVocabulary();

    expect(model.heading).toBe(POLICY_PACK_DETAIL_HUB_HEADING);
    expect(model.heading.toLowerCase()).toContain("pack detail");
    expect(model.heading.toLowerCase()).toContain("policy packs");
    expect(model.whyTwo).toBe(POLICY_PACK_DETAIL_HUB_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("assign");
    expect(model.whyTwo.toLowerCase()).toContain("inspect");
    expect(model.compactLine).toBe(POLICY_PACK_DETAIL_HUB_COMPACT_LINE);

    expect(model.packsHubLink).toEqual(POLICY_PACK_DETAIL_HUB_PACKS_LINK);
    expect(model.packsHubLink.href).toBe(GOVERNANCE_POLICY_PACKS_PATH);
    expect(model.packsHubLink.href).toBe("/governance/policy-packs");

    expect(model.packDetailLink).toEqual(POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK);
    expect(model.packDetailLink.href).toBe(GOVERNANCE_POLICY_PACKS_PATH);
  });

  it("resolves the peer surface from hub and pack detail", () => {
    expect(resolvePolicyPackDetailHubPeerLink("policy-packs")).toEqual(
      POLICY_PACK_DETAIL_HUB_PACK_DETAIL_LINK,
    );

    expect(resolvePolicyPackDetailHubPeerLink("pack-detail")).toEqual(
      POLICY_PACK_DETAIL_HUB_PACKS_LINK,
    );
  });
});
