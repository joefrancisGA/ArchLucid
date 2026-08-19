import { describe, expect, it } from "vitest";

import {
  ALERTS_INBOX_CLAIM_DISCIPLINE,
  ALERTS_INBOX_CLAIM_HEADING,
  ALERTS_INBOX_FOLLOW_UPS_TITLE,
  ALERTS_INBOX_SOURCES,
  ALERTS_INBOX_SOURCES_INTRO,
} from "@/lib/alerts-inbox-evidence-copy";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";

describe("alerts-inbox-evidence-copy", () => {
  it("exports non-empty claim discipline and Sources for AL orientation", () => {
    expect(ALERTS_INBOX_CLAIM_HEADING.length).toBeGreaterThan(0);
    expect(ALERTS_INBOX_FOLLOW_UPS_TITLE.length).toBeGreaterThan(0);
    expect(ALERTS_INBOX_CLAIM_DISCIPLINE).toContain("triage launcher");
    expect(ALERTS_INBOX_SOURCES_INTRO.length).toBeGreaterThan(0);
    expect(ALERTS_INBOX_SOURCES.length).toBeGreaterThan(0);

    for (const link of ALERTS_INBOX_SOURCES) {
      expect(link.href).not.toBe(GOVERNANCE_ALERTS_PATH);
    }
  });
});
