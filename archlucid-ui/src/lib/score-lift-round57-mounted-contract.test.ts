import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round57 mounted contract", () => {
  it("partial-capture cloud connections links use return path builder", () => {
    const surfaces = [
      "components/product-line/SecureNowHomeEnvironmentContext.tsx",
      "app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx",
      "app/(operator)/administration/securenow-sponsor-path/SecureNowSponsorPathPageView.tsx",
      "app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip.tsx",
      "components/product-line/SecureNowCollectionSetupStatusSection.tsx",
    ];

    const sharedLinks = readUiSource("components/product-line/SecureNowPartialCaptureRecoveryLinks.tsx");
    expect(sharedLinks).toContain("buildSecureNowSecondCaptureCloudConnectionsHref");

    for (const relativePath of surfaces) {
      const source = readUiSource(relativePath);

      expect(source).toMatch(/SecureNowPartialCaptureRecovery(?:Links|Paragraph)/);
      expect(source).toContain("useSecureNowPartialCaptureReturnPath");
    }
  });

  it("scorecard operational metric cards expose non-summing test ids", () => {
    const source = readUiSource("app/(operator)/insights/architecture-scorecard/_sections/ScorecardMetricCard.tsx");

    expect(source).toContain("scorecard-operational-non-summing");
    expect(source).toContain("scorecard-savings-hero-quarterly-non-summing");
  });

  it("drift workbench empty diff panels remain mounted", () => {
    const source = readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx");

    expect(source).toContain('data-testid="infra-drift-diffs-empty-not-failure"');
    expect(source).toContain('data-testid="infra-drift-inventory-empty-not-failure"');
  });
});