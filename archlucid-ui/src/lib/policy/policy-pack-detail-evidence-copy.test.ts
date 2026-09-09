import { describe, expect, it } from "vitest";

import {
  POLICY_PACK_DETAIL_CLAIM_DISCIPLINE,
  POLICY_PACK_DETAIL_FOLLOW_UPS_TITLE,
  POLICY_PACK_DETAIL_ORIENTATION_SOURCES,
  POLICY_PACK_DETAIL_PATH_PREFIX,
  POLICY_PACK_DETAIL_SOURCES,
  POLICY_PACK_DETAIL_SOURCES_INTRO,
} from "@/lib/policy/policy-pack-detail-evidence-copy";

describe("policy-pack-detail-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GPI", () => {
    expect(POLICY_PACK_DETAIL_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(POLICY_PACK_DETAIL_CLAIM_DISCIPLINE).toContain("published rules");
    expect(POLICY_PACK_DETAIL_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(POLICY_PACK_DETAIL_SOURCES.length).toBeGreaterThan(0);
    expect(POLICY_PACK_DETAIL_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of POLICY_PACK_DETAIL_ORIENTATION_SOURCES) {
      expect(link.href.startsWith(POLICY_PACK_DETAIL_PATH_PREFIX)).toBe(false);
    }
  });
});
