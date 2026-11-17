import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score-lift round59 mounted contract", () => {
  it("partial-capture strips include extract-upload test ids", () => {
    const surfaces = [
      "components/product-line/SecureNowHomeEnvironmentContext.tsx",
      "app/(operator)/administration/securenow-sponsor-path/SecureNowSponsorPathPageView.tsx",
      "app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx",
    ];

    for (const relativePath of surfaces) {
      const source = readUiSource(relativePath);

      expect(source).toContain("partial-capture-extract-upload");
      expect(source).toContain("buildSecureNowSecondCaptureExtractUploadHref");
    }
  });

  it("remediation factory priority queue partial-capture strip", () => {
    const source = readUiSource("app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx");

    expect(source).toContain('data-testid="remediation-partial-capture-priority-queue"');
    expect(source).toContain("remediation-priority-queue-partial-capture-cloud-connections");
  });

  it("drift export receipt advisory line is mounted", () => {
    const source = readUiSource("app/(operator)/governance/infrastructure/drift/DriftWorkbenchClient.tsx");

    expect(source).toContain('data-testid="infra-drift-export-receipt-advisory"');
    expect(source).toContain("DRIFT_TERRAFORM_EXPORT_RECEIPT_ADVISORY_LINE");
  });
});