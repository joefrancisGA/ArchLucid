import { describe, expect, it } from "vitest";

import {
  ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK,
  ALERTS_FINDINGS_DUAL_INBOX_COMPACT_LINE,
  ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK,
  ALERTS_FINDINGS_DUAL_INBOX_HEADING,
  ALERTS_FINDINGS_DUAL_INBOX_WHY_TWO,
  buildAlertsFindingsDualInboxReconciler,
  resolveAlertsFindingsDualInboxPeerLink,
} from "@/lib/alerts-findings-dual-inbox";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance-route-paths";

describe("alerts-findings-dual-inbox (TB-2221)", () => {
  it("explains why two inboxes exist and deep-links both surfaces", () => {
    const model = buildAlertsFindingsDualInboxReconciler();

    expect(model.heading).toBe(ALERTS_FINDINGS_DUAL_INBOX_HEADING);
    expect(model.whyTwoInboxes).toBe(ALERTS_FINDINGS_DUAL_INBOX_WHY_TWO);
    expect(model.whyTwoInboxes.toLowerCase()).toContain("alert");
    expect(model.whyTwoInboxes.toLowerCase()).toContain("finding");
    expect(model.compactLine).toBe(ALERTS_FINDINGS_DUAL_INBOX_COMPACT_LINE);

    expect(model.alertsLink).toEqual(ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK);
    expect(model.alertsLink.href).toBe(GOVERNANCE_ALERTS_PATH);
    expect(model.alertsLink.href).toBe("/governance/alerts");

    expect(model.findingsLink).toEqual(ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK);
    expect(model.findingsLink.href).toBe(GOVERNANCE_FINDINGS_PATH);
    expect(model.findingsLink.href).toBe("/governance/findings");
  });

  it("resolves the peer deep link from each surface", () => {
    expect(resolveAlertsFindingsDualInboxPeerLink("alerts-inbox")).toEqual(
      ALERTS_FINDINGS_DUAL_INBOX_FINDINGS_LINK,
    );
    expect(resolveAlertsFindingsDualInboxPeerLink("findings-queue")).toEqual(
      ALERTS_FINDINGS_DUAL_INBOX_ALERTS_LINK,
    );
  });
});
