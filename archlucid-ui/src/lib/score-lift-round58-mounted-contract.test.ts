import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round58 mounted contract", () => {
  it("remediation factory partial-capture links use return path builders", () => {
    const source = readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx");

    expect(source).toContain("remediation-partial-capture-cloud-connections");
    expect(source).toContain("buildSecureNowSecondCaptureCloudConnectionsHref");
    expect(source).toContain("buildSecureNowSecondCaptureExtractUploadHref");
  });

  it("pilot decision and investigation effort expose partial-capture test ids", () => {
    const pilotDecision = readUiSource(
      "app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx",
    );
    const investigationEffort = readUiSource(
      "app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx",
    );

    expect(pilotDecision).toContain('data-testid="securenow-pilot-decision-partial-capture"');
    expect(investigationEffort).toContain('data-testid="securenow-investigation-effort-partial-capture"');
  });

  it("drift export and extract upload return path strips are mounted", () => {
    const drift = readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx");
    const extractUpload = readUiSource(
      "app/(operator)/administration/extract-upload/_sections/ExtractUploadSettingsPageClient.tsx",
    );

    expect(drift).toContain('data-testid="infra-drift-export-terraform-not-apply"');
    expect(extractUpload).toContain('data-testid="extract-upload-return-path"');
  });

  it("collection setup second-capture upload uses return path builder", () => {
    const source = readUiSource("components/product-line/SecureNowCollectionSetupStatusSection.tsx");

    expect(source).toContain("buildSecureNowSecondCaptureExtractUploadHref");
  });
});