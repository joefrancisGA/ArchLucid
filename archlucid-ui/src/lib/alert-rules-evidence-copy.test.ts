import { describe, expect, it } from "vitest";

import {
  ALERT_RULES_ORIENTATION_SOURCES,
  ALERT_RULES_SOURCES,
} from "@/lib/alert-rules-evidence-copy";
import { GOVERNANCE_ALERT_RULES_PATH, governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";

describe("alert-rules-evidence-copy (SAX)", () => {
  it("excludes hub self-href and in-tab destinations from orientation Sources", () => {
    const orientationHrefs = ALERT_RULES_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(GOVERNANCE_ALERT_RULES_PATH);
    expect(orientationHrefs).not.toContain(governanceAlertRulesTabHref("notifications"));
    expect(orientationHrefs).not.toContain(governanceAlertRulesTabHref("test-alerts"));
    expect(ALERT_RULES_ORIENTATION_SOURCES.length).toBeLessThan(ALERT_RULES_SOURCES.length);
    expect(ALERT_RULES_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
