import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_FINDINGS_CANONICAL_PATH,
  GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE,
  GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE,
  GOVERNANCE_FINDINGS_SOURCES_INTRO,
  buildGovernanceFindingsOrientationSources,
  buildGovernanceFindingsSources,
} from "@/lib/governance/governance-findings-evidence-copy";

describe("governance-findings-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GFN", () => {
    expect(GOVERNANCE_FINDINGS_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(GOVERNANCE_FINDINGS_CLAIM_DISCIPLINE).toContain("workspace queue");
    expect(GOVERNANCE_FINDINGS_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(buildGovernanceFindingsSources(false).length).toBeGreaterThan(0);
    expect(buildGovernanceFindingsOrientationSources(false).length).toBeGreaterThan(0);

    for (const link of buildGovernanceFindingsOrientationSources(false)) {
      expect(link.href).not.toBe(GOVERNANCE_FINDINGS_CANONICAL_PATH);
    }

    for (const link of buildGovernanceFindingsOrientationSources(true)) {
      expect(link.href).not.toBe(GOVERNANCE_FINDINGS_CANONICAL_PATH);
    }
  });
});
