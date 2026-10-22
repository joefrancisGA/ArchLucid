import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCanonicalGovernanceAlertsInboxHref,
  GOVERNANCE_ALERTS_PATH,
} from "@/lib/governance/governance-route-paths";
import {
  CANONICAL_ALERTS_INBOX_TRAFFIC_PATH,
  RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH,
} from "@/lib/ui-route-traffic-alerts-inbox-tab";
import { RETIRED_GOVERNANCE_ALERTS_INBOX_TAB_HREF } from "@/lib/alerts-inbox-tab-deep-link-guard";

const PRODUCT_ALERTS_INBOX_SURFACES = [
  "archlucid-ui/src/lib/notification-preference-center.ts",
  "archlucid-ui/src/lib/alerts-help-guide-content.ts",
  "archlucid-ui/src/lib/nav-shell-visibility.ts",
] as const;

describe("approval alerts inbox legacy tab (GOI / TB-1594–TB-1596)", () => {
  it("keeps canonical inbox on bare /governance/alerts", () => {
    expect(CANONICAL_ALERTS_INBOX_TRAFFIC_PATH).toBe(GOVERNANCE_ALERTS_PATH);
    expect(RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH).toBe(RETIRED_GOVERNANCE_ALERTS_INBOX_TAB_HREF);
  });

  it("strips retired tab=inbox while preserving inbox filters", () => {
    expect(buildCanonicalGovernanceAlertsInboxHref({ tab: "inbox" })).toBe(GOVERNANCE_ALERTS_PATH);
    expect(buildCanonicalGovernanceAlertsInboxHref({ tab: "inbox", status: "Open" })).toBe(
      `${GOVERNANCE_ALERTS_PATH}?status=Open`,
    );
  });

  it("does not promote tab=inbox deep links in product handoff surfaces", () => {
    const repoRoot = join(process.cwd(), "..");

    for (const relativePath of PRODUCT_ALERTS_INBOX_SURFACES) {
      const source = readFileSync(join(repoRoot, relativePath), "utf8");

      expect(source, `${relativePath} must not deep-link ${RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH}`).not.toContain(
        RETIRED_ALERTS_INBOX_TAB_TRAFFIC_PATH,
      );
      expect(source, `${relativePath} must not deep-link tab=inbox`).not.toMatch(/tab=inbox/);
    }
  });
});
