import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_SETUP_CANONICAL_PATH,
  GOVERNANCE_SETUP_CLAIM_DISCIPLINE,
  GOVERNANCE_SETUP_FOLLOW_UPS_TITLE,
  GOVERNANCE_SETUP_ORIENTATION_SOURCES,
  GOVERNANCE_SETUP_SOURCES,
  GOVERNANCE_SETUP_SOURCES_INTRO,
} from "@/lib/governance/governance-setup-evidence-copy";

describe("governance-setup-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GFX", () => {
    expect(GOVERNANCE_SETUP_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(GOVERNANCE_SETUP_CLAIM_DISCIPLINE).toContain("checklist");
    expect(GOVERNANCE_SETUP_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(GOVERNANCE_SETUP_SOURCES.length).toBeGreaterThan(0);
    expect(GOVERNANCE_SETUP_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of GOVERNANCE_SETUP_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(GOVERNANCE_SETUP_CANONICAL_PATH);
    }
  });
});
