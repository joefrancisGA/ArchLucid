import { describe, expect, it } from "vitest";

import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";
import { ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES } from "@/lib/alert-rules-conditions-evidence-copy";

describe("alert-rules-conditions-evidence-copy (GLR)", () => {
  it("keeps orientation Sources free of alert-rules hub self-href", () => {
    const orientationHrefs = ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(GOVERNANCE_ALERT_RULES_PATH);
    expect(ALERT_RULES_CONDITIONS_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
