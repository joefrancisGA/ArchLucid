import { describe, expect, it } from "vitest";

import {
  POLICY_PACKS_HUB_CANONICAL_PATH,
  POLICY_PACKS_HUB_CLAIM_DISCIPLINE,
  POLICY_PACKS_HUB_FOLLOW_UPS_TITLE,
  POLICY_PACKS_HUB_SOURCES,
  POLICY_PACKS_HUB_SOURCES_INTRO,
  POLICY_PACKS_ORIENTATION_SOURCES,
} from "@/lib/policy/policy-packs-hub-evidence-copy";

describe("policy-packs-hub-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GPP", () => {
    expect(POLICY_PACKS_HUB_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(POLICY_PACKS_HUB_CLAIM_DISCIPLINE).toContain("policy pack library");
    expect(POLICY_PACKS_HUB_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(POLICY_PACKS_HUB_SOURCES.length).toBeGreaterThan(0);
    expect(POLICY_PACKS_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of POLICY_PACKS_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(POLICY_PACKS_HUB_CANONICAL_PATH);
    }
  });
});
