import { describe, expect, it } from "vitest";

import {
  COMPLIANCE_JOURNEY_CANONICAL_PATH,
  COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE,
  COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE_HEADING,
  COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE,
  COMPLIANCE_JOURNEY_SOURCES,
  COMPLIANCE_JOURNEY_SOURCES_INTRO,
} from "@/lib/compliance-journey-evidence-copy";

describe("compliance-journey-evidence-copy", () => {
  it("exports non-empty claim discipline and Sources for COM orientation", () => {
    expect(COMPLIANCE_JOURNEY_CANONICAL_PATH).toBe("/compliance-journey");
    expect(COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE_HEADING.length).toBeGreaterThan(0);
    expect(COMPLIANCE_JOURNEY_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(COMPLIANCE_JOURNEY_CLAIM_DISCIPLINE).toContain("procurement reviewers");
    expect(COMPLIANCE_JOURNEY_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(COMPLIANCE_JOURNEY_SOURCES.length).toBeGreaterThan(0);

    for (const link of COMPLIANCE_JOURNEY_SOURCES) {
      expect(link.href).not.toBe(COMPLIANCE_JOURNEY_CANONICAL_PATH);
    }
  });
});
