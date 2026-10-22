import { describe, expect, it } from "vitest";

import {
  RISK_EXCEPTIONS_CANONICAL_PATH,
  RISK_EXCEPTIONS_CLAIM_DISCIPLINE,
  RISK_EXCEPTIONS_FOLLOW_UPS_TITLE,
  RISK_EXCEPTIONS_ORIENTATION_SOURCES,
  RISK_EXCEPTIONS_SOURCES,
  RISK_EXCEPTIONS_SOURCES_INTRO,
} from "@/lib/risk-exceptions-evidence-copy";

describe("risk-exceptions-evidence-copy", () => {
  it("exports non-empty claim discipline and orientation Sources for GRO", () => {
    expect(RISK_EXCEPTIONS_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(RISK_EXCEPTIONS_CLAIM_DISCIPLINE).toContain("temporary approvals");
    expect(RISK_EXCEPTIONS_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(RISK_EXCEPTIONS_SOURCES.length).toBeGreaterThan(0);
    expect(RISK_EXCEPTIONS_ORIENTATION_SOURCES.length).toBeGreaterThan(0);

    for (const link of RISK_EXCEPTIONS_ORIENTATION_SOURCES) {
      expect(link.href).not.toBe(RISK_EXCEPTIONS_CANONICAL_PATH);
    }
  });
});
