import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round142 wave A mounted contract", () => {
  it("SecureNow trust drawer, upgrade CTA, reviews hub velocity", () => {
    const footer = readUiSource("components/shell/AppShellWorkspaceFooter.tsx");
    expect(footer).toContain("SecureNowProcurementTrustFooterDrawer");

    const blocked = readUiSource("components/product-line/ProductLineRouteBlockedView.tsx");
    expect(blocked).toContain("SecureNowCommercialUpgradeCtaStrip");
    expect(blocked).toContain("product-line-route-gate-entitlement-empty");

    const hubRow = readUiSource("app/(operator)/architecture/reviews/_sections/ReviewsHubInventoryRow.tsx");
    expect(hubRow).toContain("ReviewsHubDecisionSlaBadge");
    expect(hubRow).toContain("ReviewsHubWaitingOnChip");

    const spine = readUiSource("components/reviews/RunDetailFirstReviewSpineBand.tsx");
    expect(spine).toContain("ReviewWorkspaceDeferredNotificationsDrawer");
  });
});
