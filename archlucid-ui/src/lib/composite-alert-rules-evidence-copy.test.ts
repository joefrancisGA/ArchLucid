import { describe, expect, it } from "vitest";

import {
  COMPOSITE_ALERT_RULES_ORIENTATION_SOURCES,
} from "@/lib/composite-alert-rules-evidence-copy";
import { ALERT_RULES_SOURCES } from "@/lib/alert-rules-evidence-copy";
import { governanceAlertRulesTabHref } from "@/lib/governance/governance-route-paths";

describe("composite-alert-rules-evidence-copy (GOA)", () => {
  it("excludes self-href to the advanced-rules tab from orientation Sources", () => {
    const orientationHrefs = COMPOSITE_ALERT_RULES_ORIENTATION_SOURCES.map((source) => source.href);

    expect(orientationHrefs).not.toContain(governanceAlertRulesTabHref("advanced-rules"));
    expect(COMPOSITE_ALERT_RULES_ORIENTATION_SOURCES.length).toBeLessThan(ALERT_RULES_SOURCES.length);
    expect(COMPOSITE_ALERT_RULES_ORIENTATION_SOURCES.length).toBeGreaterThan(0);
  });
});
