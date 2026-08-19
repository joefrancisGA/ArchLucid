import { describe, expect, it } from "vitest";

import {
  AUDIT_TRAIL_CANONICAL_PATH,
  AUDIT_TRAIL_CLAIM_DISCIPLINE,
  AUDIT_TRAIL_CLAIM_HEADING,
  AUDIT_TRAIL_FOLLOW_UPS_TITLE,
  AUDIT_TRAIL_SOURCES,
  AUDIT_TRAIL_SOURCES_INTRO,
} from "@/lib/audit-trail-evidence-copy";

describe("audit-trail-evidence-copy", () => {
  it("exports non-empty claim discipline and Sources for AUD orientation", () => {
    expect(AUDIT_TRAIL_CLAIM_HEADING.length).toBeGreaterThan(0);
    expect(AUDIT_TRAIL_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(AUDIT_TRAIL_CLAIM_DISCIPLINE).toContain("activity log");
    expect(AUDIT_TRAIL_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(AUDIT_TRAIL_SOURCES.length).toBeGreaterThan(0);

    for (const link of AUDIT_TRAIL_SOURCES) {
      expect(link.href).not.toBe(AUDIT_TRAIL_CANONICAL_PATH);
    }
  });
});
