import { describe, expect, it } from "vitest";

import {
  STANDARDS_RULES_CANONICAL_PATH,
  STANDARDS_RULES_CLAIM_DISCIPLINE,
  STANDARDS_RULES_FOLLOW_UPS_TITLE,
  STANDARDS_RULES_ORIENTATION_SOURCES,
  STANDARDS_RULES_ORIENTATION_SOURCES_INTRO,
  STANDARDS_RULES_SOURCES,
} from "@/lib/standards-rules-evidence-copy";

describe("standards-rules-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GRS", () => {
    expect(STANDARDS_RULES_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(STANDARDS_RULES_CLAIM_DISCIPLINE).toContain("Standards & rules");
    expect(STANDARDS_RULES_ORIENTATION_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(STANDARDS_RULES_SOURCES.length).toBeGreaterThan(0);
    expect(STANDARDS_RULES_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of STANDARDS_RULES_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(STANDARDS_RULES_CANONICAL_PATH);
    }
  });
});
