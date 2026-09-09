import { describe, expect, it } from "vitest";

import {
  DECISION_REGISTER_CANONICAL_PATH,
  DECISION_REGISTER_CLAIM_DISCIPLINE,
  DECISION_REGISTER_FOLLOW_UPS_TITLE,
  DECISION_REGISTER_ORIENTATION_SOURCES,
  DECISION_REGISTER_SOURCES,
  DECISION_REGISTER_SOURCES_INTRO,
} from "@/lib/decision-register-evidence-copy";

describe("decision-register-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GDO", () => {
    expect(DECISION_REGISTER_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(DECISION_REGISTER_CLAIM_DISCIPLINE).toContain("finalized review records");
    expect(DECISION_REGISTER_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(DECISION_REGISTER_SOURCES.length).toBeGreaterThan(0);
    expect(DECISION_REGISTER_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of DECISION_REGISTER_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(DECISION_REGISTER_CANONICAL_PATH);
    }
  });
});
