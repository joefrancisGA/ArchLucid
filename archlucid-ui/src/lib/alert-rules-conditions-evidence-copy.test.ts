import { describe, expect, it } from "vitest";

import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES } from "@/lib/alert-rules-conditions-evidence-copy";

describe("alert-rules-conditions-evidence-copy (GLR)", () => {
  it("keeps orientation Sources free of alert-rules hub self-href", () => {
    const orientationHrefs = ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(GOVERNANCE_ALERT_RULES_PATH);
    expect(ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });

  it("uses hubSecondary orientation intro copy", async () => {
    const { ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES_INTRO } = await import(
      "@/lib/alert-rules-conditions-evidence-copy"
    );

    expect(ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES_INTRO).toContain("Primary actions on this page come first.");
  });
});
