import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round60 mounted contract", () => {
  it("shared recovery links module is used on primary surfaces", () => {
    const surfaces = [
      "components/product-line/SecureNowHomeEnvironmentContext.tsx",
      "app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx",
      "app/(operator)/help/_sections/HelpConnectionStatusWorkspaceReadinessStrip.tsx",
    ];

    for (const relativePath of surfaces) {
      const source = readUiSource(relativePath);

      expect(source).toContain("SecureNowPartialCaptureRecoveryParagraph");
    }
  });

  it("admin spine and cloud connections partial-capture strips", () => {
    expect(readUiSource("app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx")).toContain(
      "SecureNowAdminPartialCaptureStrip",
    );
    expect(
      readUiSource("app/(operator)/integrations/cloud-connections/_sections/CloudConnectionsPageShell.tsx"),
    ).toContain("SecureNowCloudConnectionsPartialCaptureStrip");
    expect(readUiSource("components/product-line/SecureNowCollectionSetupStatusSection.tsx")).toContain(
      "collection-ready-partial-capture",
    );
  });

  it("simulator not-inventory capture line is mounted", () => {
    const source = readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx");

    expect(source).toContain('data-testid="remediation-simulator-not-inventory-capture"');
  });
});