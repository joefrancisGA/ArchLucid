import { describe, expect, it } from "vitest";

import {
  ALERTS_FINDINGS_ALERTS_LINK,
  ALERTS_FINDINGS_COMPACT_LINE,
  ALERTS_FINDINGS_FINDINGS_LINK,
  ALERTS_FINDINGS_HEADING,
  ALERTS_FINDINGS_WHY_TWO,
  buildAlertsFindingsVocabulary,
  resolveAlertsFindingsPeerLink,
} from "@/lib/vocabulary/alerts-findings-vocabulary";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";

describe("alerts-findings-vocabulary (TB-2319)", () => {
  it("explains alerts triage vs findings disposition", () => {
    const model = buildAlertsFindingsVocabulary();

    expect(model.heading).toBe(ALERTS_FINDINGS_HEADING);
    expect(model.heading.toLowerCase()).toContain("alerts");
    expect(model.heading.toLowerCase()).toContain("findings");
    expect(model.whyTwo).toBe(ALERTS_FINDINGS_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("acknowledge");
    expect(model.whyTwo.toLowerCase()).toContain("resolve");
    expect(model.compactLine).toBe(ALERTS_FINDINGS_COMPACT_LINE);

    expect(model.alertsLink).toEqual(ALERTS_FINDINGS_ALERTS_LINK);
    expect(model.alertsLink.href).toBe(GOVERNANCE_ALERTS_PATH);
    expect(model.alertsLink.href).toBe("/governance/alerts");

    expect(model.findingsLink).toEqual(ALERTS_FINDINGS_FINDINGS_LINK);
    expect(model.findingsLink.href).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(model.findingsLink.href).toBe("/governance/findings");
  });

  it("resolves the peer surface from alerts inbox and findings queue", () => {
    expect(resolveAlertsFindingsPeerLink("alerts-inbox")).toEqual(ALERTS_FINDINGS_FINDINGS_LINK);
    expect(resolveAlertsFindingsPeerLink("findings-queue")).toEqual(ALERTS_FINDINGS_ALERTS_LINK);
  });
});
